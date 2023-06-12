const Admin = require('../models/adminModel');
const mongoose = require('mongoose');
const jwt = require("jsonwebtoken")

// jwt createToken
const createToken = (_id,companyId) => {
    return jwt.sign({_id,companyId}, process.env.SECRET_JWT, { expiresIn: "1d" })
}

// login 
const loginAdmin = async (req,res) => {
    const admin = req.body

    try {
        const adminRes = await Admin.login(admin)
        // create token
        const token = createToken(adminRes._id,adminRes.companyId)
        res.status(200).json({_id: adminRes._id, adminUsername: adminRes.adminUsername, token})
    } catch (err) {
        res.status(400).json({error: err.message})
    }
}

// signup 
const signupAdmin = async (req,res) => {
    const admin = req.body
    
    try {
        const adminRes = await Admin.signup(admin)
        
        // create token
        const token = createToken(adminRes._id,adminRes.companyId)
        res.status(200).json({_id: adminRes._id, adminUsername: adminRes.adminUsername, token})
    } catch (err) {
        res.status(400).json({error: err.message})
    }
}

// // profile details 
// const getPatientDetails = async (req,res) => {
//     try {
//         const tokenId = req.patientId._id.toString();
//         if (!mongoose.Types.ObjectId.isValid(tokenId)) {
//             return res.status(404).json({error: "No patient found!"});
//         }

//         const patientDetails = await Patient.findById(tokenId).select('-patientPassword');
//         if (!patientDetails) {
//             return res.status(404).json({error: "No patient found!"})
//         }

//         res.status(200).json(patientDetails);
//     } catch (err) {
//         return res.status(404).json({error: err})
//     }
// }

// // update details
// const updatePatientDetails = async(req, res) => {
//     try {
//         const tokenId = req.patientId._id.toString();

//         if (!mongoose.Types.ObjectId.isValid(tokenId)) {
//             return res.status(404).json({error: "No patient found!"});
//         }

//         const patientUpdatedDetails = await Patient.findOneAndUpdate({ _id : tokenId}, {
//             ...req.body,
//             ineligibleField: req.ineligibleField,
//             patientEligible: req.ineligibleField.length===0?true:false
//         },{new: true}).select('-patientPassword');

//         if (!patientUpdatedDetails) {
//             return res.status(404).json({error: "No patient found!"})
//         }

//         res.status(200).json(patientUpdatedDetails);
//     } catch (err) {
//         return res.status(404).json({error: err })
//     }
// }

// admin get own details
const adminGetOwnDetails = async (req,res) => {
    try {
        const adminId = req.adminId;

        if (!mongoose.Types.ObjectId.isValid(adminId)) {
            return res.status(404).json({error: "No admin found!"});
        }

        const admintDetails = await Admin.findOne({
            _id: adminId,
            companyId: req.companyId
        }).select('-adminPassword');

        if (!admintDetails) {
            return res.status(404).json({error: "No admin found!"})
        }

        res.status(200).json(admintDetails);
    } catch (err) {
        return res.status(404).json({error: err})
    }
}
module.exports = {
    loginAdmin,
    signupAdmin,
    adminGetOwnDetails,
}