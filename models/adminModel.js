const mongoose = require('mongoose')
const Schema = mongoose.Schema
const bcrypt = require("bcrypt")
const validator = require("validator")
const Company = require("./companyDetailsModel")

const adminSchema = new Schema({
    companyId: {
        type: Schema.Types.ObjectId,
        required: [true, "missing companyId"],
    },
    adminUsername: {
        type: String,
        required: [true, "missing patientName"],
        unique: [true, "adminUsername existed"],
        default: ""
    },
    adminEmail: {
        type: String,
        required: [true, "missing adminEmail"],
        unique: [true, "adminEmail existed"],
    },
    adminPassword: {
        type: String,
        required: [true, "missing adminPassword"],
    },
}, {timestamps: true})

// static signup method
adminSchema.statics.signup = async function(admin) {
    const adminUsername = admin.adminUsername
    // const patientNoMyKad = patient.patientNoMyKad
    const adminEmail = admin.adminEmail
    const adminPassword = admin.adminPassword
    const adminCompanyId = admin.companyId
    const secret = admin.secret

    if ( secret !== process.env.SECRET_SIGNUP) {
        throw Error("Secret incorrect")
    }

    // validation
    if (!adminEmail || !adminPassword || !adminUsername) {
        throw Error("Email, username and password field must be filled!")
    }
    if (!validator.isEmail(adminEmail)){
        throw Error("Email is not valid")
    }
    if (!validator.isStrongPassword(adminPassword)){
        throw Error("Password is not strong enough")
    }

    // unique check
    const existsEmail = await this.findOne({adminEmail})
    if (existsEmail) {
        throw Error("Email already existed")
    }
    const existsUsername = await this.findOne({adminUsername})
    if (existsUsername) {
        throw Error("Username already existed")
    }
    
    const existCompanyId = await Company.findOne({_id: adminCompanyId})
    if (!existCompanyId) {
        throw Error("Company does not exist")
    }

    // db 
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(adminPassword,salt)

    const cryptedAdmin = {...admin, adminPassword: hash}
    const respond = this.create(cryptedAdmin)

    return respond
}

// static login method
adminSchema.statics.login = async function(admin) {
    const adminUsername = admin.adminUsername
    const companyId = admin.companyId
    const adminPassword = admin.adminPassword

    if ( !adminPassword || !adminUsername) {
        throw Error("Username and password field must be filled!")
    }

    // find
    const adminFound = await this.findOne({adminUsername,companyId})
    if (!adminFound) {
        throw Error("Incorrect username")
    }

    // db 
    const match = await bcrypt.compare(adminPassword, adminFound.adminPassword)
    if (!match) {
        throw Error("Incorrect password")
    }

    return adminFound
}

module.exports = mongoose.model('Admin',adminSchema)