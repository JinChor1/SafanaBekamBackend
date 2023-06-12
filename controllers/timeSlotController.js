const mongoose = require('mongoose');
const Company = require('../models/companyDetailsModel');
const Booking = require('../models/bookingModel');
const ServiceDetails = require('../models/serviceDetailsModel');
const Patient = require('../models/patientModel');
const moment = require('moment'); 
const dateFNS = require('date-fns')

// find company operating details
const getCompanyOperatingDetails = async (companyId) => {
    const companyHours = await Company.findOne({_id: companyId},['businessHours', 'availableFutureDays'])
    const nonWorkingDays = Object.entries(companyHours.businessHours._doc)
        .filter((day)=>{
            return !day[1].isWorkingDay}
        ).map((day)=>{
            return day[0]
        })
    const companyOperatingDetails = {
        businessHours: companyHours.businessHours,
        nonWorkingDays: nonWorkingDays,
        availableFutureDays: companyHours.availableFutureDays
    }
    return companyOperatingDetails
}

// find booked dates
const getBookedDates = async (companyId,days,excludeId) => {
    if (days) {
        const existingBooking = await Booking.find({
            companyId: companyId,
            'bookingDate.endTime': {
                $gte: moment().hours(0).minutes(0).seconds(0).milliseconds(0).toDate(),
                $lte: moment().add(days+1,'days').hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
            }
        },['bookingStatus','bookingDate']).sort({'bookingDate.startTime':'asc'})

        return existingBooking
    }
    if (!days && excludeId){
        const existingBooking = await Booking.find({
            companyId: companyId,
            _id: {$ne: excludeId}
        },['bookingStatus','bookingDate']).sort({'bookingDate.startTime':'asc'})

        return existingBooking
    }
}

// get booking number
const getBookingNumber = async (offset) => {
    offset = offset? offset: 1
    let bookingNumber = (await Booking.count()+offset).toString()
    while (bookingNumber.length < 6) bookingNumber = "0" + bookingNumber
    bookingNumber = "B-" + bookingNumber
    // check if exist
    const hasBookingNumber = await Booking.exists({bookingNumber: bookingNumber})

    return (hasBookingNumber?getBookingNumber(offset+1):bookingNumber)
}


const timeSlotDifference = (availableTimeSlots, unavailableTimeSlots) => {
    if (!availableTimeSlots || !unavailableTimeSlots) return [];
    const _orderedAvailableTimeSlots = [...availableTimeSlots];
    const _unavailableTimeSlots = [...unavailableTimeSlots];
    _orderedAvailableTimeSlots.sort((a, b) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
    let cursorIndex = 0;
    while (cursorIndex < _orderedAvailableTimeSlots.length) {
      const availableSlot = _orderedAvailableTimeSlots[cursorIndex];
      
      const availableSlotStartTime = new Date(availableSlot.startTime);
      const availableSlotEndTime = new Date(availableSlot.endTime);
      // go ahead and make sure everything has a proper date object
      if (typeof availableSlot.startTime === 'string') {
      availableSlot.startTime = availableSlotStartTime;
      }
      if (typeof availableSlot.endTime === 'string') {
      availableSlot.endTime = availableSlotEndTime;

      }
      try {
        for (const unavailableSlot of _unavailableTimeSlots) {
          try {

            const unavailableSlotStartTime = new Date(unavailableSlot.startTime);
            const unavailableSlotEndTime = new Date(unavailableSlot.endTime);
            // go ahead and make sure everything has a proper date object
            if (typeof unavailableSlot.startTime === 'string') {
              unavailableSlot.startTime = unavailableSlotStartTime;
            }
            if (typeof unavailableSlot.endTime === 'string') {
              unavailableSlot.endTime = unavailableSlotEndTime;
            }
            if (
                dateFNS.isBefore(unavailableSlotStartTime, availableSlotStartTime) ||
                dateFNS.isEqual(unavailableSlotStartTime, availableSlotStartTime)
            ) {
              if (dateFNS.isBefore(availableSlotStartTime, unavailableSlotEndTime)) {
                if (dateFNS.isBefore(unavailableSlotEndTime, availableSlotEndTime)) {
                  // |--------[-availableSlot-]---------|
                  // |-[---unavailable----]-------------|
                  availableSlot.startTime = unavailableSlotEndTime;
                } else {
                  // |--------[-availableSlot-]---------|
                  // |----[----unavailable-------]------|
                  _orderedAvailableTimeSlots.splice(cursorIndex, 1);
                  // subtract if we split or splice
                  cursorIndex--;
                }
              }
            } else if (dateFNS.isBefore(unavailableSlotStartTime, availableSlotEndTime)) {
              if (dateFNS.isBefore(unavailableSlotEndTime, availableSlotEndTime)) {
                // |------[---availableSlot----]------|
                // |-------[--unavailable---]---------|???????
                const newSlot = {
                  ...availableSlot,
                  startTime: unavailableSlotEndTime,
                };
                availableSlot.endTime = unavailableSlotStartTime;
                _orderedAvailableTimeSlots.splice(cursorIndex + 1, 0, newSlot);
                // subtract if we split or splice
                cursorIndex--;
              } else {
                // |-----[----availableSlot----]------|
                // |-------[----unavailable-------]---|
                availableSlot.endTime = unavailableSlotStartTime;
              }
            }
          } catch (err) {
            console.error('Invalid Date for unavailable slot: ', unavailableSlot);
            throw err;
          }
        }
      } catch (err) {
        console.error('Invalid Date for available slot: ', availableSlot);
        throw err;
      }
  
      cursorIndex++;
    }
    return _orderedAvailableTimeSlots; 
};

// get company available time slot
const getTimeSlot = async (req,res) => {
    try {
        const id  = req.companyId._id.toString();
        const companyOperatingDetails = await getCompanyOperatingDetails(id)
        const existingBooking = await getBookedDates(id,companyOperatingDetails.availableFutureDays)
        const availableTimeslots = []
        const unavailableTimeslots = []

        // availableTimeslots
        for (i=0; i<companyOperatingDetails.availableFutureDays; i++){
            let tempStartTime = moment().add(i,'days').minutes(0).seconds(0).milliseconds(0);
            let tempEndTime = moment().add(i,'days').minutes(0).seconds(0).milliseconds(0);
            let tempStartDay = tempStartTime.format('dddd').toLowerCase();
            if (companyOperatingDetails.businessHours[tempStartTime.format('dddd').toLowerCase()].isWorkingDay == true &&
                !(i==0 && tempStartTime.hours() > companyOperatingDetails.businessHours[tempStartDay].endTime)
            ) {
                if (i==0 && tempStartTime.hours() > companyOperatingDetails.businessHours[tempStartDay].startTime){
                    tempStartTime.add(1,'hours')
                } else {
                    tempStartTime.hours(companyOperatingDetails.businessHours[tempStartDay].startTime)
                }
                tempEndTime.hours(companyOperatingDetails.businessHours[tempStartDay].endTime)
                availableTimeslots.push({
                    startTime: tempStartTime.toDate(),
                    endTime: tempEndTime.toDate()
                })
            }
        }

        // unavailableTimeslots
        existingBooking.forEach((booked)=>{
            if (booked.bookingStatus == "Active") {
                let tempStartTime = moment(booked.bookingDate.startTime)
                let tempEndTime = moment(booked.bookingDate.endTime)
                isBetween = false
                availableTimeslots.forEach((available)=>{
                    isBetween = tempStartTime.isBetween(available.startTime,available.endTime)? true : isBetween
                    isBetween = tempEndTime.isBetween(available.startTime,available.endTime)? true : isBetween
                })

                if (isBetween === true){
                    // combine continuous time slot
                    const foundIndex = unavailableTimeslots.findIndex((unavailable) => moment(unavailable.endTime).isSame(tempStartTime) === true)
                    if (foundIndex===-1){
                        unavailableTimeslots.push({
                            startTime: tempStartTime.toDate(),
                            endTime: tempEndTime.toDate()
                        })
                    } else {
                        unavailableTimeslots[foundIndex].endTime = tempEndTime.toDate()
                    }
                }
            }
        })
        res.status(200).json(timeSlotDifference(availableTimeslots,unavailableTimeslots))
    } catch (e) {
        return res.status(404).json({error: e})
    }
}

// add booking
const addBooking = async (req,res) => {
    try {
        // jwt variable
        const companyId = req.companyId._id.toString()
        const patientId = req.patientId._id.toString()

        const companyOperatingDetails = await getCompanyOperatingDetails(companyId)
        const existingBooking = await getBookedDates(companyId,companyOperatingDetails.availableFutureDays)
        // check service under company
        const serviceDetails = await ServiceDetails.findOne({_id: req.body.serviceId, companyId: companyId});
        if (!serviceDetails) {
            return res.status(404).json({error: "No service found"});
        }
        if (serviceDetails.serviceStatus!=="Active") {
            return res.status(400).json({error: "Service is inactive"});
        }
        // check patient eligible
        const patient = await Patient.findOne({_id: patientId}).select('patientEligible');
        if (patient.patientEligible===false) {
            return res.status(400).json({error: "User not eligible for booking, please complete profile details first!"});
        }
        // check booked time conflict
        let isBetween = false
        const bookingStartTime = moment(req.body.bookingDate.startTime)
        const bookingEndTime = moment(req.body.bookingDate.startTime).add(serviceDetails.serviceDuration ,'hours')
    
        existingBooking.forEach((existbook) => {
            if (existbook.bookingStatus == "Active"){
                let tempStartTime =  moment(existbook.bookingDate.startTime)
                let tempEndTime =  moment(existbook.bookingDate.endTime)
                if (bookingStartTime.isBetween(tempStartTime,tempEndTime) || 
                    bookingEndTime.isBetween(tempStartTime,tempEndTime) ||
                    bookingStartTime.isSame(tempStartTime)) {
                        isBetween = true
                }
            }
        })
        // return if time conflict
        if (isBetween==true){
            return res.status(400).json({error: "Time slot conflict"});
        }
        // check company business hour conflict
        let isBetweenHour = false
        let isWorkingDay = true
        let isBetweenFutureDay = true
        
        companyOperatingDetails.nonWorkingDays.forEach((nonWorkingDay)=>{
            if (nonWorkingDay == bookingStartTime.format('dddd').toLowerCase()) {
                isWorkingDay = false
            }
        })
        Object.entries(companyOperatingDetails.businessHours._doc).forEach((businessDay)=>{
            if (businessDay[0] == bookingStartTime.format('dddd').toLowerCase() &&
                bookingStartTime.hours() >= businessDay[1].startTime &&
                bookingEndTime.hours() >= businessDay[1].startTime &&
                bookingStartTime.hours() <= businessDay[1].endTime &&
                bookingEndTime.hours() <= businessDay[1].endTime 
            ) {
                isBetweenHour = true
            }
        })
        if (bookingStartTime.isAfter(moment().add(companyOperatingDetails.availableFutureDays,'days'))) {
            isBetweenFutureDay = false
        }
        // return if business hour conflict conflict
        if ( isBetweenHour == false || isWorkingDay == false || isBetweenFutureDay== false ){
            console.log(isBetweenHour,isWorkingDay,isBetweenFutureDay )
            return res.status(400).json({error: "Time slot conflict with business hour"});
        }
        // get booking number
        const bookingNumber = await getBookingNumber()
        // format new req
        const formattedBody = { ...req.body, 
            bookingDate: { 
                startTime: bookingStartTime.toDate(),
                endTime: bookingEndTime.toDate()
            },
            patientId: patientId,
            companyId: companyId,
            bookingNumber: bookingNumber
        }
        const booking = await Booking.create(formattedBody)
        res.status(200).json(booking)
    } catch (err) {
        res.status(400).json({error: err.message})
    }
}

const getBookingByCustomer = async (req,res) => {
    try {
        const { page } = req.params
        const id = req.patientId._id.toString()
        const customerBooking = []
        const existingBookingCount = await Booking.countDocuments({patientId: id});
        const hasNext = existingBookingCount > ((Number(page)+1)*5)
        const existingBooking = await Booking 
            .find({patientId: id})
            .sort({'updatedAt':'desc'})
            .skip(page*5)
            .limit(5)
        for ( booked of existingBooking) {
            let serviceDetails = await ServiceDetails.findOne({_id: booked.serviceId})
            customerBooking.push({
                bookingDetails: booked,
                serviceDetails: serviceDetails
            })
        }
        res.status(200).json({customerBooking,hasNext})
    } catch(err) {
        res.status(400).json({error: err.message})
    }
}

const adminGetBookingByCustomer = async (req,res) => {
    try {
        const { id, page } = req.params
        const customerBooking = []
        const existingBookingCount = await Booking.countDocuments({patientId: id, companyId: req.companyId});
        const hasNext = existingBookingCount > ((Number(page)+1)*5)
        const existingBooking = await Booking 
            .find({patientId: id, companyId: req.companyId})
            .sort({'updatedAt':'desc'})
            .skip(page*5)
            .limit(5)
        for ( booked of existingBooking) {
            let serviceDetails = await ServiceDetails.findOne({_id: booked.serviceId, companyId: req.companyId})
            customerBooking.push({
                bookingDetails: booked,
                serviceDetails: serviceDetails
            })
        }
        res.status(200).json({customerBooking,hasNext})
    } catch(err) {
        res.status(400).json({error: err.message})
    }
}

const adminGetBookingDetails = async (req, res) => {
    try {
        const { id } = req.params

        const bookingData = await Booking.aggregate([
            {
                "$match": {
                    "_id": new mongoose.Types.ObjectId(id),
                    "companyId": new mongoose.Types.ObjectId(req.companyId),
                }
            },
            {
                "$project": {
                    "serviceId":1, 
                    "patientId": 1, 
                    "bookingDate": 1, 
                    "bookingStatus": 1, 
                    "bookingNumber":1, 
                    "bookingNotes": 1, 
                    "completedData": 1,
                    "createdAt": 1
                }
            },
            // Service Details
            {
                "$lookup": {
                    "from":  ServiceDetails.collection.name,
                    "localField": "serviceId",
                    "foreignField": "_id",
                    "pipeline": [
                        { "$project": {"serviceName":1, "servicePic": 1}}
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
            }
        ])

        if (!bookingData) {
            return res.status(404).json({error: "No booking found!"})
        }
           
        res.status(200).json(bookingData)
        
    } catch (e) {
        res.status(400).json({error: e})
    }
}

// admin update booking
const adminUpdateBooking = async (req,res) => {
    try {
        // jwt variable
        const companyId = req.companyId
        const { id } = req.params

        const companyOperatingDetails = await getCompanyOperatingDetails(companyId)
        const existingBooking = await getBookedDates(companyId,null,id)
        // check service under company
        const serviceDetails = await ServiceDetails.findOne({_id: req.body.serviceId, companyId: companyId});
        if (!serviceDetails) {
            return res.status(404).json({error: "No service found"});
        }
        if (serviceDetails.serviceStatus!=="Active") {
            return res.status(400).json({error: "Service is inactive"});
        }
        // check booked time conflict
        let isBetween = false
        const bookingStartTime = moment(req.body.bookingDate.startTime)
        const bookingEndTime = moment(req.body.bookingDate.startTime).add(serviceDetails.serviceDuration ,'hours')
    
        existingBooking.forEach((existbook) => {
            if (existbook.bookingStatus == "Active"){
                let tempStartTime =  moment(existbook.bookingDate.startTime)
                let tempEndTime =  moment(existbook.bookingDate.endTime)
                if (bookingStartTime.isBetween(tempStartTime,tempEndTime) || 
                    bookingEndTime.isBetween(tempStartTime,tempEndTime) ||
                    bookingStartTime.isSame(tempStartTime)) {
                        isBetween = true
                }
            }
        })
        // return if time conflict
        if (isBetween==true){
            return res.status(400).json({error: "Time slot conflict"});
        }
        // check company business hour conflict
        let isBetweenHour = false
        let isWorkingDay = true
        let isBetweenFutureDay = true
        
        companyOperatingDetails.nonWorkingDays.forEach((nonWorkingDay)=>{
            if (nonWorkingDay == bookingStartTime.format('dddd').toLowerCase()) {
                isWorkingDay = false
            }
        })
        Object.entries(companyOperatingDetails.businessHours._doc).forEach((businessDay)=>{
            if (businessDay[0] == bookingStartTime.format('dddd').toLowerCase() &&
                bookingStartTime.hours() >= businessDay[1].startTime &&
                bookingEndTime.hours() >= businessDay[1].startTime &&
                bookingStartTime.hours() <= businessDay[1].endTime &&
                bookingEndTime.hours() <= businessDay[1].endTime 
            ) {
                isBetweenHour = true
            }
        })
        if (bookingStartTime.isAfter(moment().add(companyOperatingDetails.availableFutureDays,'days'))) {
            isBetweenFutureDay = false
        }
        // return if business hour conflict conflict
        if ( isBetweenHour == false || isWorkingDay == false || isBetweenFutureDay== false ){
            console.log(isBetweenHour,isWorkingDay,isBetweenFutureDay )
            return res.status(400).json({error: "Time slot conflict with business hour"});
        }

        const booking = await Booking.findOneAndUpdate({
            _id: id,
            companyId: companyId
        },{
            bookingDate: { 
                startTime: bookingStartTime.toDate(),
                endTime: bookingEndTime.toDate()
            },
            serviceId: req.body.serviceId,
            bookingNotes: req.body.bookingNotes,
            bookingStatus: req.body.bookingStatus
        },{new: true})

        res.status(200).json(booking)
    } catch (err) {
        res.status(400).json({error: err.message})
    }
}

const adminCancelBooking = async (req,res) => {
    try {
        const { id } = req.params
        const companyId = req.companyId

        const booking = await Booking.findOneAndUpdate({
            _id: id,
            companyId: companyId
        },{
            bookingStatus: "Cancelled"
        },{new: true})

        res.status(200).json(booking)
    } catch (err) {
        res.status(400).json({error: err.message})
    }
}

const adminCompleteBooking = async (req,res) => {
    try {
        const { id } = req.params
        const companyId = req.companyId

        const booking = await Booking.findOneAndUpdate({
            _id: id,
            companyId: companyId
        },{
            bookingStatus: "Completed",
            completedData: req.body
        },{new: true})

        res.status(200).json(booking)
    } catch (err) {
        res.status(400).json({error: err.message})
    }
}

const adminGetCalendar = async (req,res) => {
    try {
        const companyId = req.companyId

        const existingBooking = await Booking.find({
            companyId: companyId,
            'bookingDate.startTime': {
                $gte: moment(req.body.currentStart).toDate()
            },
            'bookingDate.endTime': {
                $lte: moment(req.body.currentEnd).toDate()
            }
        },['bookingNumber','bookingDate','bookingStatus'])
        .sort({'bookingDate.startTime':'asc'})
        
        const booking = existingBooking.map((each)=>({
            id: each._id,
            title: each.bookingNumber,
            start: each.bookingDate.startTime,
            end: each.bookingDate.endTime,
            display: 'block',
            borderColor: "#fff",
            textColor: each.bookingStatus==="Active"?"#FF6F00":each.bookingStatus==="Completed"?"#008D04":"#FA5C76",
            backgroundColor: each.bookingStatus==="Active"?"#FEE7CE":each.bookingStatus==="Completed"?"#BCDEBD":"#FED6DC",
        }))

        res.status(200).json(booking)
    } catch (err) {
        res.status(400).json({error: err.message})
    }
}

const adminGetMobileCalendar = async (req,res) => {
    try {
        const companyId = req.companyId

        const existingBooking = await Booking.find({
            companyId: companyId,
            // 'bookingDate.startTime': {
            //     $gte: moment().toDate()
            // },
            bookingStatus: 'Active',
        },['bookingNumber','bookingDate','bookingStatus'])
        .sort({'bookingDate.startTime':'asc'})
        
        const agendaItems = [];
        let index = 0;
        for (const booking of existingBooking) {
            if (agendaItems[index] && agendaItems[index].title === moment(booking.bookingDate.startTime).hour(0).toISOString()){
                agendaItems[index].data.push({
                    hour: moment(booking.bookingDate.startTime).format("hA"),
                    duration: moment(booking.bookingDate.endTime).diff(moment(booking.bookingDate.startTime),'hour'),
                    title: booking.bookingNumber
                });
            } else {
                agendaItems.push({
                    title: moment(booking.bookingDate.startTime).hour(0).toISOString(),
                    data:[{
                        hour: moment(booking.bookingDate.startTime).format("hA"),
                        duration: moment(booking.bookingDate.endTime).diff(moment(booking.bookingDate.startTime),'hour'),
                        title: booking.bookingNumber
                    }]
                });
                if (agendaItems[index] && agendaItems[index].title !== moment(booking.bookingDate.startTime).hour(0).toISOString()){
                    index++;
                }
            }
        }

        res.status(200).json(agendaItems)
    } catch (err) {
        res.status(400).json({error: err.message})
    }
}
module.exports = {
    getTimeSlot,
    addBooking,
    getBookingByCustomer,
    adminGetBookingByCustomer,
    adminGetBookingDetails,
    adminUpdateBooking,
    adminCancelBooking,
    adminCompleteBooking,
    adminGetCalendar,
    adminGetMobileCalendar,
}