const express = require('express')
const router = express.Router();
const {
    loginPatient,
    signupPatient,
    getPatientDetails,
    updatePatientDetails,
    verifyPatientCode,
    verifyResetPassword,
    changePatientPassword,
} = require('../controllers/patientController');
const requireAuth = require('../middleware/requireAuth');
const validatePatientDetails = require('../middleware/validatePatientDetails')

// login
router.post('/login',loginPatient)

// register
router.post('/signup',signupPatient)

// confirmation
router.get('/confirm/:confirmation_code',verifyPatientCode)

// password reset email
router.post('/reset/1',verifyResetPassword)

// change password
router.post('/reset/2',changePatientPassword)

// jwt
router.use(requireAuth);

// get profile details
router.get('/profile',getPatientDetails);

// update profile details
router.patch('/update',validatePatientDetails,updatePatientDetails);

module.exports = router
