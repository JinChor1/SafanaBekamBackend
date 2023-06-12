const mongoose = require('mongoose')
const Schema = mongoose.Schema

const GalleryListSchema = new Schema({
    gallery: {
        type: String
    }
})

const ContactUsSchema = new Schema({
    facebookLink: {
        type: String
    },
    whatsAppLink: {
        type: String
    },
    phoneNumber: { 
        type: String
    },
    Address: { 
        type: String
    },
    lat: {
        type: String
    },
    lng: { 
        type:String
    }
})

const BusinessHoursSchema = new Schema({
    monday: {
        startTime: {
            type: Number,
        },
        endTime: {
            type: Number,
        },
        isWorkingDay: {
            type: Boolean
        }
    },
    tuesday: {
        startTime: {
            type: Number,
        },
        endTime: {
            type: Number,
        },
        isWorkingDay: {
            type: Boolean
        }
    },
    wednesday: {
        startTime: {
            type: Number,
        },
        endTime: {
            type: Number,
        },
        isWorkingDay: {
            type: Boolean
        }
    },
    thursday: {
        startTime: {
            type: Number,
        },
        endTime: {
            type: Number,
        },
        isWorkingDay: {
            type: Boolean
        }
    },
    friday: {
        startTime: {
            type: Number,
        },
        endTime: {
            type: Number,
        },
        isWorkingDay: {
            type: Boolean
        }
    },
    saturday: {
        startTime: {
            type: Number,
        },
        endTime: {
            type: Number,
        },
        isWorkingDay: {
            type: Boolean
        }
    },
    sunday: {
        startTime: {
            type: Number,
        },
        endTime: {
            type: Number,
        },
        isWorkingDay: {
            type: Boolean
        }
    },
},{ _id: false })

const CompanyDetailsSchema = new Schema({
    companyName: {
        type: String,
        required: [true, "missing companyName"],
    },
    companyLogo: {
        type: String,
    },
    aboutUsDesc: {
        type: String,
    },
    availableFutureDays:{
        type: Number
    },
    companyURI: {
        type: String,
    },
    galleryList: [GalleryListSchema],
    contactUsDetails: ContactUsSchema,
    businessHours: BusinessHoursSchema
}, {timestamps: true});

module.exports = mongoose.model('CompanyDetail',CompanyDetailsSchema)
