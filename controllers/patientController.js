const Patient = require('../models/patientModel');
const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const CompanyDetails = require('../models/companyDetailsModel');
const bcrypt = require("bcrypt")
const validator = require("validator")

// jwt createToken
const createToken = (_id,companyId) => {
    return jwt.sign({_id,companyId}, process.env.SECRET_JWT, { expiresIn: "1d" })
}

// login 
const loginPatient = async (req,res) => {
    const patient = req.body;

    try {
        const patientRes = await Patient.login(patient)
        // create token
        const token = createToken(patientRes._id,patientRes.companyId)

        // // Nodemailer
        // let transporter = nodemailer.createTransport({
        //     service: 'gmail',
        //     auth: {
        //     type: 'OAuth2',
        //     user: process.env.MAIL_USERNAME,
        //     pass: process.env.MAIL_PASSWORD,
        //     clientId: process.env.OAUTH_CLIENTID,
        //     clientSecret: process.env.OAUTH_CLIENT_SECRET,
        //     refreshToken: process.env.OAUTH_REFRESH_TOKEN
        //     }
        // });
        // let mailOptions = {
        //     from: 'noreply@safanabekam9999.com',
        //     to: patient.patientEmail,
        //     subject: 'Nodemailer Project',
        //     text: 'Hi from your nodemailer project'
        // };
        // transporter.sendMail(mailOptions, function(err, data) {
        //     if (err) {
        //         res.status(404).json({error: err});
        //     } else {
        //         res.status(200).json({_id: patientRes._id, patientEmail: patientRes.patientEmail, token});
        //     }
        // });

        res.status(200).json({_id: patientRes._id, patientEmail: patientRes.patientEmail, token});
    } catch (err) {
        res.status(400).json({error: err.message})
    }
}

// signup 
const signupPatient = async (req,res) => {
    const patient = req.body

    try {
        const patientRes = await Patient.signup(patient)
        const companyDetails = await CompanyDetails.findById(patientRes.companyId)
        
        // *** (updated 11 june for email confirmation) ***
        // create token 
        // const token = createToken(patientRes._id,patientRes.companyId)
        // res.status(200).json({_id: patientRes._id, patientEmail: patientRes.patientEmail, token})

        // Nodemailer
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
            type: 'OAuth2',
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
            clientId: process.env.OAUTH_CLIENTID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            refreshToken: process.env.OAUTH_REFRESH_TOKEN
            }
        });
        let mailOptions = {
            from: `${companyDetails.companyName} <jinchor0413@gmail.com>`, // doesnt matter for now -> requires invited as Google Project tester
            to: patientRes.patientEmail,
            subject: `[${companyDetails.companyName}] Confirmation For Your Registration`,
            html: `<h1>Confirm your registration to get started!</h1>
            <h3>Please confirmed that ${patientRes.patientEmail} is the email address you have entered when signing up for ${companyDetails.companyName}'s booking website.</h3>
            <a href=${companyDetails.companyURI}Confirm/${patientRes.confirmationCode}><h2>Verify Email<h2></a>`
        };

        transporter.sendMail(mailOptions, function(err, data) {
            if (err) {
                return res.status(404).json({error: err});
            }
        });

        res.status(200).json({_id: patientRes._id, patientEmail: patientRes.patientEmail});
    } catch (err) {
        return res.status(400).json({error: err.message})
    }
}

// confirmation code
const verifyPatientCode = async (req,res) => {
    try {
        const { confirmation_code } = req.params
        const { patientEmail, patientCompanyId } = jwt.verify(confirmation_code, process.env.SECRET_JWT)

        const patientRes = await Patient.findOne({patientEmail: patientEmail, companyId: patientCompanyId, confirmationCode: confirmation_code})

        if (!patientRes) {
            return res.status(404).json({error: 'No patient found!'})
        }

        const updatePatient = await Patient.findOneAndUpdate({patientEmail: patientEmail, companyId: patientCompanyId, confirmationCode: confirmation_code},{
            patientStatus: 'Active'
        },{new: true}).select('-patientPassword');

        res.status(200).json({_id: updatePatient._id, patientEmail: updatePatient.patientEmail});
    } catch (err) {
        return res.status(404).json({error: err})
    }
}

// send reset pass email
const verifyResetPassword = async (req,res) => {
    try{ 
        const { patientEmail, companyId } = req.body;

        if (!patientEmail) {
            return res.status(404).json({error: 'Email address field must be filled!'})
        }
        if (!validator.isEmail(patientEmail)){
            return res.status(404).json({error: 'Email is not valid!'})
        }

        const patientRes = await Patient.findOne({patientEmail: patientEmail, companyId: companyId});
        const companyDetails = await CompanyDetails.findById(companyId);

        if (!patientRes) {
            return res.status(404).json({error: 'No patient account found!'})
        }

        // Nodemailer
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
            type: 'OAuth2',
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
            clientId: process.env.OAUTH_CLIENTID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            refreshToken: process.env.OAUTH_REFRESH_TOKEN
            }
        });
        let mailOptions = {
            from: `${companyDetails.companyName} <jinchor0413@gmail.com>`, // doesnt matter for now -> requires invited as Google Project tester
            to: patientRes.patientEmail,
            subject: `[${companyDetails.companyName}] Confirmation For Your Password Reset `,
            html: `<h1>Password Reset</h1>
            <h3>We've received a request to reset your account's password for ${companyDetails.companyName}'s booking website.</h3>
            <a href=${companyDetails.companyURI}Reset/Change/${patientRes.confirmationCode}><h2>Reset Your Password<h2></a>`
        };

        transporter.sendMail(mailOptions, function(err, data) {
            if (err) {
                res.status(404).json({error: err});
            }
        });

        res.status(200).json({_id: patientRes._id, patientEmail: patientRes.patientEmail});
    } catch (err) {
        return res.status(404).json({error: JSON.stringify(err)})
    }
}

// send reset pass email
const changePatientPassword = async (req,res) => {
    try {
        const { confirmationCode, patientPassword, patientRePassword } = req.body;
        const { patientEmail, patientCompanyId } = jwt.verify(confirmationCode, process.env.SECRET_JWT)

        if (!validator.isStrongPassword(patientPassword)){
            return res.status(404).json({error: "Password is not strong enough"})
        }
        if (patientPassword!==patientRePassword){
            return res.status(404).json({error: "Password does not matches with second password"})
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(patientPassword,salt);
        const patientRes = await Patient.findOneAndUpdate({
            patientEmail: patientEmail, 
            companyId: patientCompanyId,
            confirmationCode: confirmationCode,
        },{patientPassword: hash},{new: true}).select('-patientPassword');

        res.status(200).json({patientEmail: patientRes.patientEmail});
    } catch (err) {
        return res.status(404).json({error: JSON.stringify(err)})
    }
}


// profile details 
const getPatientDetails = async (req,res) => {
    try {
        const tokenId = req.patientId._id.toString();
        if (!mongoose.Types.ObjectId.isValid(tokenId)) {
            return res.status(404).json({error: "No patient found!"});
        }

        const patientDetails = await Patient.findById(tokenId).select('-patientPassword');
        if (!patientDetails) {
            return res.status(404).json({error: "No patient found!"})
        }

        res.status(200).json(patientDetails);
    } catch (err) {
        return res.status(404).json({error: err})
    }
}

// update details
const updatePatientDetails = async(req, res) => {
    try {
        const tokenId = req.patientId._id.toString();

        if (!mongoose.Types.ObjectId.isValid(tokenId)) {
            return res.status(404).json({error: "No patient found!"});
        }

        const patientUpdatedDetails = await Patient.findOneAndUpdate({ _id : tokenId}, {
            ...req.body,
            ineligibleField: req.ineligibleField,
            patientEligible: req.ineligibleField.length===0?true:false
        },{new: true}).select('-patientPassword');

        if (!patientUpdatedDetails) {
            return res.status(404).json({error: "No patient found!"})
        }

        res.status(200).json(patientUpdatedDetails);
    } catch (err) {
        return res.status(404).json({error: err })
    }
}
// admin get patient list
const adminPatientList = async(req,res) => {
    const { page, search_filter} = req.params
    const per_page = 6
    const patients = await Patient
        .find({
            companyId: req.companyId,
            $or: [{
                patientName: search_filter!=="null"? {$regex: search_filter} :{$ne: ""}
            },{
                patientPhone: search_filter!=="null"? {$regex: search_filter} :{$ne: ""}
            },{
                patientEmail: search_filter!=="null"? {$regex: search_filter} :{$ne: ""}
            }]
        },[
            'patientName',
            'patientPhone',
            'patientEmail'
        ])
        .sort({'updatedAt':'desc'})
        .skip(page*per_page)
        .limit(per_page)

    const total = await Patient.count({
        companyId: req.companyId,
        $or: [{
            patientName: search_filter!=="null"? {$regex: search_filter} :{$ne: ""}
        },{
            patientPhone: search_filter!=="null"? {$regex: search_filter} :{$ne: ""}
        },{
            patientEmail: search_filter!=="null"? {$regex: search_filter} :{$ne: ""}
        }]
    })

    const hasNext = total > ((Number(page)+1)*per_page)

    if (!patients){
        return res.status(404).json({error: "No patient found!"})
    }

    res.status(200).json({patients,hasNext});
}
// admin mobile get patient list
const adminMobilePatientList = async(req,res) => {
    const { search_filter} = req.params
    const patients = await Patient
        .find({
            companyId: req.companyId,
            $or: [{
                patientName: search_filter!=="null"? {$regex: search_filter} :{$ne: ""}
            },{
                patientPhone: search_filter!=="null"? {$regex: search_filter} :{$ne: ""}
            },{
                patientEmail: search_filter!=="null"? {$regex: search_filter} :{$ne: ""}
            }]
        },[
            'patientName',
            'patientPhone',
            'patientEmail'
        ])
        .sort({'updatedAt':'desc'})

    const total = await Patient.count({
        companyId: req.companyId,
        $or: [{
            patientName: search_filter!=="null"? {$regex: search_filter} :{$ne: ""}
        },{
            patientPhone: search_filter!=="null"? {$regex: search_filter} :{$ne: ""}
        },{
            patientEmail: search_filter!=="null"? {$regex: search_filter} :{$ne: ""}
        }]
    })

    if (!patients){
        return res.status(404).json({error: "No patient found!"})
    }

    res.status(200).json({patients});
}
// admin get profile details 
const adminGetPatientDetails = async (req,res) => {
    try {
        const { id: patientId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(404).json({error: "No patient found!"});
        }

        const patientDetails = await Patient.findOne({
            _id: patientId,
            companyId: req.companyId
        }).select('-patientPassword');

        if (!patientDetails) {
            return res.status(404).json({error: "No patient found!"})
        }

        res.status(200).json(patientDetails);
    } catch (err) {
        return res.status(404).json({error: err})
    }
}
// admin update patient details
const adminUpdatePatientDetails = async(req, res) => {
    try {
        const { id: patientId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(404).json({error: "No patient found!"});
        }

        const patientUpdatedDetails = await Patient.findOneAndUpdate(
            { 
                _id : patientId,
                companyId: req.companyId
            }, 
            {
                ...req.body,
                ineligibleField: req.ineligibleField,
                patientEligible: req.ineligibleField.length===0?true:false
            },{new: true}).select('-patientPassword');

        if (!patientUpdatedDetails) {
            return res.status(404).json({error: "No patient found!"})
        }

        res.status(200).json(patientUpdatedDetails);
    } catch (err) {
        return res.status(404).json({error: err })
    }
}
module.exports = {
    loginPatient,
    signupPatient,
    getPatientDetails,
    updatePatientDetails,
    adminPatientList,
    adminGetPatientDetails,
    adminUpdatePatientDetails,
    adminMobilePatientList,
    verifyPatientCode,
    verifyResetPassword,
    changePatientPassword,
}