const ServiceDetails = require('../models/serviceDetailsModel');
const mongoose = require('mongoose');
const Booking = require('../models/bookingModel');
const Patient = require('../models/patientModel');
const moment = require('moment');

const getBookingDatatable = async (req,res) => {
    const { page, per_page, sort_field, sort_direction, date_filter, status_filter, search_filter} = req.params

    const bookingData1 = await Booking.aggregate([
        {
            "$match": {
                "companyId": new mongoose.Types.ObjectId(req.companyId),
                "bookingDate.startTime": date_filter!=="null"?{
                    $gte: date_filter? new Date(date_filter):"",
                    $lte: date_filter? moment(date_filter).add(1,'days').toDate():""
                }:{$ne: ""},
                "bookingStatus": status_filter!=="null"?status_filter: {$ne: ""},
            }
        },
        {
            "$project": {"serviceId":1, "patientId": 1, "bookingDate": 1, "bookingStatus": 1, "bookingNumber":1}
        },
        // Service Details
        {
            "$lookup": {
                "from":  ServiceDetails.collection.name,
                "localField": "serviceId",
                "foreignField": "_id",
                "pipeline": [
                    { "$project": {"serviceName":1}}
                ],
                "as": "serviceDetails"
            }
        },
        // Patient Details
        {
            "$lookup": {
                "from":  Patient.collection.name,
                "localField": "patientId",
                "foreignField": "_id",
                "pipeline": [
                    { "$project": {"patientName":1, "patientPhone": 1}}
                ],
                "as": "patientDetails"
            }
        },
        // Unwind
        {
            "$unwind": {
                "path": "$serviceDetails",
            }
        },
        {
            "$unwind": {
                "path": "$patientDetails",
            }
        },
        // search field
        {
            "$match": {
                "$or": [
                    {
                        "bookingNumber": search_filter!=="null"?{"$regex": search_filter }:{$ne: ""},
                    },
                    {
                        "patientDetails.patientName": search_filter!=="null"?{"$regex": search_filter }:{$ne: ""},
                    },
                    {
                        "serviceDetails.serviceName": search_filter!=="null"?{"$regex": search_filter }: {$ne: ""},
                    },
                ]
            }
        },
        // Sorting
        {
            "$sort" : { [ sort_field ? sort_field : "updatedAt" ]: sort_field ? sort_direction==="asc"? 1 : -1 : -1 }
        },
        {
            "$facet" : {
                "data": [
                    // Pagination
                    {
                        "$skip" : (page-1)*per_page
                    },
                    {
                        "$limit": Number(per_page)
                    }
                ],
                "total":  [{ "$count": "count" }],
            }
        },
    ])

    res.status(200).json({ 
        data : bookingData1[0].data, 
        total: bookingData1[0].data.length===0 ? 0 : bookingData1[0].total[0].count , 
        page, 
        per_page
    });
}

module.exports = {
    getBookingDatatable
}