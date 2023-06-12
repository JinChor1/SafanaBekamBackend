const mongoose = require('mongoose')
const Schema = mongoose.Schema

const BookingDateSchema = new Schema({
    startTime: {
        type: Date
    },
    endTime: {
        type: Date 
    }
}, {_id: false})

const CompletedDataSchema = new Schema({
    beforeBP: {
        BPM: {
            type: String
        }, 
        SYS: {
            type: String
        }, 
        DIA: {
            type: String
        }
    },
    afterBP: {
        BPM: {
            type: String
        }, 
        SYS: {
            type: String
        }, 
        DIA: {
            type: String
        }
    },
    healthProblem: {
        type: String
    },
    remarks: {
        type: Array
    }
}, {_id: false})

const BookingDetailsSchema = new Schema({
    companyId: {
        type: Schema.Types.ObjectId,
        required: [true, "missing companyId"],
    },
    serviceId: {
        type: Schema.Types.ObjectId,
        required: [true, "missing serviceId"],
    },
    patientId: {
        type: Schema.Types.ObjectId,
        required: [true, "missing patientId"],
    },
    bookingDate : BookingDateSchema,
    bookingStatus : {
        type: String,
        required: [true, "missing bookingStatus"],
    },
    bookingNotes : {
        type: String,
    },
    bookingNumber : {
        type: String,
        unique: [true, "bookingNumber not unique"],
    },
    completedData : CompletedDataSchema
}, {timestamps: true})


module.exports = mongoose.model('BookingDetail',BookingDetailsSchema)