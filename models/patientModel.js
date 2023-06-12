const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require("bcrypt")
const validator = require("validator")
const Company = require("./companyDetailsModel")
const jwt = require("jsonwebtoken");

const healthSchema = new Schema({
    diabetes: {
        displayName:{
            type: String,
            default: "Diabetes"
        },
        hasDisease:{
            type: Boolean,
            default: false
        },
        medication:{
            type: String,
            default: ""
        }
    },
    hypertension: {
        displayName:{
            type: String,
            default: "Hypertension"
        },
        hasDisease:{
            type: Boolean,
            default: false
        },
        medication:{
            type: String,
            default: ""
        }
    },
    hypotension: {
        displayName:{
            type: String,
            default: "Hypotension"
        },
        hasDisease:{
            type: Boolean,
            default: false
        },
        medication:{
            type: String,
            default: ""
        }
    },
    heart: {
        displayName:{
            type: String,
            default: "Heart Problem"
        },
        hasDisease:{
            type: Boolean,
            default: false
        },
        medication:{
            type: String,
            default: ""
        }
    },
    cancer: {
        displayName:{
            type: String,
            default: "Cancer / Tumor"
        },
        hasDisease:{
            type: Boolean,
            default: false
        },
        medication:{
            type: String,
            default: ""
        }
    },
    aids: {
        displayName:{
            type: String,
            default: "AIDS"
        },
        hasDisease:{
            type: Boolean,
            default: false
        },
        medication:{
            type: String,
            default: ""
        }
    },
    dvt: {
        displayName:{
            type: String,
            default: "Deep Vein Thrombosis (DVT)"
        },
        hasDisease:{
            type: Boolean,
            default: false
        },
        medication:{
            type: String,
            default: ""
        }
    },
    blooddisease: {
        displayName:{
            type: String,
            default: "Blood Related Disease"
        },
        hasDisease:{
            type: Boolean,
            default: false
        },
        medication:{
            type: String,
            default: ""
        }
    },
    contagious: {
        displayName:{
            type: String,
            default: "Any Contagious Disease"
        },
        hasDisease:{
            type: Boolean,
            default: false
        },
        medication:{
            type: String,
            default: ""
        }
    },
    haemophobia: {
        displayName:{
            type: String,
            default: "Haemophobia"
        },
        hasDisease:{
            type: Boolean,
            default: false
        },
        medication:{
            type: String,
            default: ""
        }
    },
    migraine: {
        displayName:{
            type: String,
            default: "Migraine"
        },
        hasDisease:{
            type: Boolean,
            default: false
        },
        medication:{
            type: String,
            default: ""
        }
    },
    gout: {
        displayName:{
            type: String,
            default: "Gout"
        },
        hasDisease:{
            type: Boolean,
            default: false
        },
        medication:{
            type: String,
            default: ""
        }
    },
    liver: {
        displayName:{
            type: String,
            default: "Liver Problem"
        },
        hasDisease:{
            type: Boolean,
            default: false
        },
        medication:{
            type: String,
            default: ""
        }
    },
    kidney: {
        displayName:{
            type: String,
            default: "Kidney Problem"
        },
        hasDisease:{
            type: Boolean,
            default: false
        },
        medication:{
            type: String,
            default: ""
        }
    },
    nerve: {
        displayName:{
            type: String,
            default: "Spinal and Nerve Problem"
        },
        hasDisease:{
            type: Boolean,
            default: false
        },
        medication:{
            type: String,
            default: ""
        }
    },
    bleeding: {
        displayName:{
            type: String,
            default: "Bleeding Problem"
        },
        hasDisease:{
            type: Boolean,
            default: false
        },
        medication:{
            type: String,
            default: ""
        }
    },
    operation: {
        displayName:{
            type: String,
            default: "Operation"
        },
        hasDisease:{
            type: Boolean,
            default: false
        },
        medication:{
            type: String,
            default: ""
        }
    }
}, { _id: false })

const patientSchema = new Schema({
    companyId: {
        type: Schema.Types.ObjectId,
        required: [true, "missing companyId"],
    },
    patientName: {
        type: String,
        // required: [true, "missing patientName"],
        default: ""
    },
    patientNoMyKad: {
        type: String,
        // required: [true, "missing patientNoMyKad"],
        unique: [true, "missing patientNoMyKad"],
        sparse: true
    },
    patientEmail: {
        type: String,
        required: [true, "missing patientEmail"],
        unique: [true, "missing patientEmail"],
    },
    patientPassword: {
        type: String,
        required: [true, "missing patientPassword"],
    },
    patientGender: {
        type: String,
        default: ""
    },
    patientRace: {
        type: String,
        default: ""
    },
    patientAddress: {
        type: String,
        default: ""
    },
    patientPostcode: {
        type: String,
        default: ""
    },
    patientState: {
        type: String,
        default: ""
    },
    patientOccupation: {
        type: String,
        default: ""
    },
    patientPhone: {
        type: String,
        default: ""
    },
    patientStatus: {
        type: String,
        enum: ['Pending','Active'],
        default: "Pending"
    },
    confirmationCode: { 
        type: String, 
        unique: true 
    },
    patientEligible: {
        type: Boolean,
        default: false
    },
    healthBackground: {
        type: healthSchema,
        default: () => ({})
    },
    ineligibleField: {
        type: Array,
        default: [
            'patientName',
            'patientNoMyKad',
            'patientGender',
            'patientRace',
            'patientOccupation',
            'patientPhone',
            'patientAddress',
            'patientPostcode',
            'patientState'
        ]
    }
}, {timestamps: true})

// static signup method
patientSchema.statics.signup = async function(patient) {
    const patientEmail = patient.patientEmail
    // const patientNoMyKad = patient.patientNoMyKad
    const patientPassword = patient.patientPassword
    const patientRePassword = patient.patientRePassword
    const patientCompanyId = patient.companyId

    // validation
    if (!patientEmail || !patientPassword) {
        throw Error("Email and password field must be filled!")
    }
    if (!validator.isEmail(patientEmail)){
        throw Error("Email is not valid")
    }
    if (!validator.isStrongPassword(patientPassword)){
        throw Error("Password is not strong enough")
    }
    if (patientPassword!==patientRePassword){
        throw Error("Password does not matches with second password")
    }

    // unique check
    const existsEmail = await this.findOne({patientEmail})
    if (existsEmail) {
        throw Error("Email already existed")
    }
    
    const existCompanyId = await Company.findOne({_id: patientCompanyId})
    if (!existCompanyId) {
        throw Error("Company does not exist")
    }
    // const existsNoMyKad = await this.findOne({patientNoMyKad})
    // if (existsNoMyKad) {
    //     throw Error("No My Kad already existed")
    // }

    // db 
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(patientPassword,salt)
    const confirmationCode = jwt.sign({patientEmail, patientCompanyId}, process.env.SECRET_JWT)

    const cryptedPatient = {...patient, patientPassword: hash, confirmationCode: confirmationCode}
    const respond = this.create(cryptedPatient)

    return respond
}

// static login method
patientSchema.statics.login = async function(patient) {
    const patientEmail = patient.patientEmail
    const companyId = patient.companyId
    const patientPassword = patient.patientPassword

    if (!patientEmail || !patientPassword) {
        throw Error("Email and password field must be filled!")
    }

    // find
    const patientFound = await this.findOne({patientEmail,companyId})
    if (!patientFound) {
        throw Error("Incorrect email")
    }

    // db 
    const match = await bcrypt.compare(patientPassword, patientFound.patientPassword)
    if (!match) {
        throw Error("Incorrect password")
    }

    // status email confirmation
    const isPending = patientFound.patientStatus === "Pending"
    if (isPending){
        throw Error("Please check your email for confirmation first!")
    }

    return patientFound
}

module.exports = mongoose.model('Patient',patientSchema)