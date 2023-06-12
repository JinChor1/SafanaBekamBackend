const ServiceDetails = require('../models/serviceDetailsModel');
const mongoose = require('mongoose');
const Booking = require('../models/bookingModel');
const Patient = require('../models/patientModel');
const moment = require('moment');

// card widget
const getWidgetData = async (companyId) => {
    // upcoming booking 7 days 
    const upcomingBookingCount = await Booking.countDocuments({
        companyId: companyId,
        bookingStatus: "Active",
        'bookingDate.startTime': {
            $gte: moment().add(1,'hours').minutes(0).seconds(0).milliseconds(0).toDate(),
            $lte: moment().add(7,'days').hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
        }
    })
    // past completed booking 0-6 days
    const pastBookingCount = await Booking.countDocuments({
        companyId: companyId,
        bookingStatus: "Completed",
        'bookingDate.startTime': {
            $gte: moment().subtract(6,'days').hours(0).minutes(0).seconds(0).milliseconds(0).toDate(),
            $lte: moment().minutes(0).seconds(0).milliseconds(0).toDate()
        }
    })
    // upcoming booking percentage
    const percentageUpcoming =  pastBookingCount===0? upcomingBookingCount*100:(upcomingBookingCount - pastBookingCount)/pastBookingCount * 100
    // upcoming booking widget
    const upcomingBooking = {
        count: upcomingBookingCount,
        percentage: percentageUpcoming + "%",
        isNegative: percentageUpcoming<0
    }
    // past completed booking 7-14 days
    const pastCompletedBookingCount = await Booking.countDocuments({
        companyId: companyId,
        bookingStatus: "Completed",
        'bookingDate.startTime': {
            $gte: moment().subtract(13,'days').hours(0).minutes(0).seconds(0).milliseconds(0).toDate(),
            $lte: moment().subtract(6,'days').hours(0).minutes(0).seconds(0).milliseconds(0).toDate(),
        }
    })
    // completed booking percentage
    const percentageCompleted =  pastCompletedBookingCount===0? pastBookingCount*100:(pastBookingCount - pastCompletedBookingCount)/pastCompletedBookingCount * 100
    // completed booking widget
    const completedBooking = {
        count: pastBookingCount,
        percentage: percentageCompleted + "%",
        isNegative: percentageCompleted<0
    }
    // revenue 0-6 days
    const completedRevenueBooking = await Booking.find({
        companyId: companyId,
        bookingStatus: "Completed",
        'bookingDate.startTime': {
            $gte: moment().subtract(6,'days').hours(0).minutes(0).seconds(0).milliseconds(0).toDate(),
            $lte: moment().minutes(0).seconds(0).milliseconds(0).toDate()
        }
    },['serviceId']);
    let revenueThisWeek = 0;
    for ( const revenueThis of completedRevenueBooking) {
        let price = await ServiceDetails.findOne({_id: revenueThis.serviceId},['servicePrice']);
        revenueThisWeek += price.servicePrice;
    }
    // revenue 7-14 days
    const pastRevenueBooking = await Booking.find({
        companyId: companyId,
        bookingStatus: "Completed",
        'bookingDate.startTime': {
            $gte: moment().subtract(13,'days').hours(0).minutes(0).seconds(0).milliseconds(0).toDate(),
            $lte: moment().subtract(6,'days').hours(0).minutes(0).seconds(0).milliseconds(0).toDate(),
        }
    },['serviceId'])
    let revenuePastWeek = 0;
    for ( const revenuePast of pastRevenueBooking) {
        let price = await ServiceDetails.findOne({_id: revenuePast.serviceId},['servicePrice']);
        revenuePastWeek += price.servicePrice;
    }
    // revenue percentage
    const percentageRevenue =  revenuePastWeek===0? revenueThisWeek*100:(revenueThisWeek - revenuePastWeek)/revenuePastWeek * 100
    // revenue widget
    const revenue = {
        count: revenueThisWeek,
        percentage: percentageRevenue.toFixed(0)  + "%",
        isNegative: percentageRevenue<0
    }
    // new patient 0-6 days
    const newPatientCount = await Patient.countDocuments({
        companyId: companyId,
        createdAt: {
            $gte: moment().subtract(6,'days').hours(0).minutes(0).seconds(0).milliseconds(0).toDate(),
            $lte: moment().minutes(0).seconds(0).milliseconds(0).toDate()
        }
    })
    // new patient 7-14 days
    const pastPatientCount = await Patient.countDocuments({
        companyId: companyId,
        createdAt: {
            $gte: moment().subtract(13,'days').hours(0).minutes(0).seconds(0).milliseconds(0).toDate(),
            $lte: moment().subtract(6,'days').hours(0).minutes(0).seconds(0).milliseconds(0).toDate(),
        }
    })
    // new patient percentage
    const percentagePatient =  pastPatientCount===0? newPatientCount*100:(newPatientCount - pastPatientCount)/pastPatientCount * 100
    // new patient widget
    const newPatient = {
        count: newPatientCount,
        percentage: percentagePatient + "%",
        isNegative: percentagePatient<0
    }

    return {upcomingBooking,completedBooking,revenue,newPatient}
}

const getBookingInsightData = async (companyId) => {
    const upcomingBookingCount = await Booking.countDocuments({
        companyId: companyId,
        bookingStatus: "Active",
    })
    const completedBookingCount = await Booking.countDocuments({
        companyId: companyId,
        bookingStatus: "Completed",
    })
    const cancelledBookingCount = await Booking.countDocuments({
        companyId: companyId,
        bookingStatus: "Cancelled",
    })
    // chart data
    const data = {
        labels: [ "Upcoming Booking", "Completed Booking", "Cancelled Booking" ],
        datasets: [
            {
                label: "Number of booking",
                data: [upcomingBookingCount,completedBookingCount,cancelledBookingCount],
                backgroundColor: [
                    "#FAB05C",
                    "#5CFA61",
                    "#FA5C76"
                ],
                borderWidth: 0
            }
        ]
    }
    // percentage
    const total = upcomingBookingCount + completedBookingCount + cancelledBookingCount
    // no booking
    if (total===0){
        const percentageData = {
            upcomingBooking: {
                upcomingBookingPercentage: "0 %",
                display: "Upcoming Booking"
            },
            completedBooking: {
                completedBookingPercentage: "0 %",
                display: "Completed Booking"
            },
            cancelledBooking: {
                cancelledBookingPercentage: "0 %",
                display: "Cancelled Booking"
            }
        }
        return {data, percentageData}
    }
    // have booking
    const upcomingBookingPercentage = (upcomingBookingCount/total * 100).toFixed(2) + " %"
    const completedBookingPercentage = (completedBookingCount/total * 100).toFixed(2) + " %"
    const cancelledBookingPercentage = (cancelledBookingCount/total * 100).toFixed(2) + " %"
    const percentageData = {
        upcomingBooking: {
            upcomingBookingPercentage,
            display: "Upcoming"
        },
        completedBooking: {
            completedBookingPercentage,
            display: "Completed"
        },
        cancelledBooking: {
            cancelledBookingPercentage,
            display: "Cancelled"
        }
    }

    return {data, percentageData}
}

const getBookingLineData = async (companyId) => {
    const labels = []
    const data = []

    for (let i=0 ; i<7 ; i++){
        // past completed booking
        let gteTime = moment().subtract(((i+1)*7)-1,'days').hours(0).minutes(0).seconds(0).milliseconds(0);
        let lteTime = moment().subtract((i*7)-1,'days').hours(0).minutes(0).seconds(0).milliseconds(0);

        let pastCompletedBookingCount = await Booking.countDocuments({
            companyId: companyId,
            bookingStatus: "Completed",
            'bookingDate.startTime': {
                $gte: gteTime.toDate(),
                $lte: lteTime.toDate()
            }
        })

        let lteTimeDisplay = lteTime.subtract(1,'days')
        labels.push(gteTime.date()+"/"+(gteTime.month()+1)+"-"+(lteTimeDisplay.date())+"/"+(lteTimeDisplay.month()+1))
        data.push(pastCompletedBookingCount)
    }

    const datasets = [{
        label: "Week's Completed Bookings",
        data: data.reverse(),
        borderColor: "#0099FF",
        backgroundColor: "#205273",
        pointRadius: 5,
        pointHoverRadius: 7
    }]

    return { labels: labels.reverse(), datasets}
}

const getTopServiceData = async (companyId) => {
    const returnData = []
    const totalBooking = await Booking.countDocuments({companyId})
    const topServiceData = await Booking.aggregate([
        {
            "$match": { 
                "companyId": new mongoose.Types.ObjectId(companyId)
            }
        },
        {   
            "$group": {
                "_id": "$serviceId",
                "count": { "$sum": 1 }
            },
        },
        {
            "$sort": { "count" : -1 }
        }
    ])
    let positionIndex = 1
    for (const topService of topServiceData) {
        let serviceDetails = await ServiceDetails.findOne({_id: topService._id},['serviceName'])
        returnData.push({
            position: positionIndex,
            serviceDetails,
            percentage: topService.count/totalBooking*100,
            count: topService.count
        })
        positionIndex++
    }

    return returnData.slice(0,4)
}

// get all dashboard data
const getAllDashboardData = async (req,res) => {
    const companyId = req.companyId;

    const widgetData = await getWidgetData(companyId);
    const bookingInsightData = await getBookingInsightData(companyId);
    const bookingLineData = await getBookingLineData(companyId);
    const topServiceData = await getTopServiceData(companyId);

    if (!widgetData || !bookingInsightData || !bookingLineData || !topServiceData) {
        return res.status(404).json({error: "Error loading dashboard data"});
    }
    
    res.status(200).json({widgetData,bookingInsightData,bookingLineData,topServiceData});
}


module.exports = {
    getAllDashboardData
}