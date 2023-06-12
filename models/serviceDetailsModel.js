const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ServiceDetailsSchema = new Schema({
    companyId: {
        type: Schema.Types.ObjectId,
        required: [true, "missing companyId"],
    },
    serviceName: {
        type: String,
        required: [true, "missing serviceName"],
    },
    serviceDesc: {
        type: String,
        required: [true, "missing serviceDesc"],
    },
    serviceDuration: {
        type: Number,
        required: [true, "missing serviceDuration"],
    },
    servicePic: {
        type: String,
        required: [true, "missing servicePic"],
    },
    servicePrice: {
        type: Number,
        required: [true, "missing servicePrice"],
    },
    serviceStatus: {
        type: String,
        default: "Active"
    }
}, {timestamps: true})


module.exports = mongoose.model('ServiceDetail',ServiceDetailsSchema)