const express = require('express')
const router = express.Router();
const requireAdminAuth = require('../middleware/requireAdminAuth');
const {
    loginAdmin,
    signupAdmin,
    adminGetOwnDetails,
} = require('../controllers/adminController');
const {
    getAllDashboardData
} = require('../controllers/dashboardController');
const {
    getBookingDatatable
} = require('../controllers/datatableController.js');
const {
    adminPatientList,
    adminGetPatientDetails,
    adminUpdatePatientDetails,
    adminMobilePatientList,
} = require('../controllers/patientController');
const {
    adminGetBookingByCustomer,
    adminGetBookingDetails,
    adminUpdateBooking,
    adminCancelBooking,
    adminCompleteBooking,
    adminGetCalendar,
    adminGetMobileCalendar,
} = require('../controllers/timeSlotController')
const {
    adminGetAllServiceName,
    adminGetAllServiceFilter,
    adminGetSingleServiceDetails,
    adminUpdateService,
    adminCreateService
} = require('../controllers/serviceDetailsController')
const {
    adminGetCompanyDetails,
    adminUseGeocode,
    adminUpdateCompanyDetails,
} = require('../controllers/companyDetailsController');
const validatePatientDetails = require('../middleware/validatePatientDetails')

// login
router.post('/login',loginAdmin)

// register
router.post('/signup',signupAdmin)

// // jwt
// router.use(requireAuth);

// // get profile details
// router.get('/profile',getPatientDetails);

// // validate details 
// router.use(validatePatientDetails);

// // update profile details
// router.patch('/update',updatePatientDetails);


// required
router.use(requireAdminAuth);

// get all dashboard data
router.get('/dashboard', getAllDashboardData);

// get own details
router.get('/details', adminGetOwnDetails);

// get booking datatable
router.get('/datatable/booking/:page/:per_page/:sort_field/:sort_direction/:date_filter/:status_filter/:search_filter', getBookingDatatable);

// get patient list
router.get('/patient/:page/:search_filter', adminPatientList);

// get patient details
router.get('/patient/:id', adminGetPatientDetails);

// get customer booking
router.get('/patient/getBooking/:id/:page', adminGetBookingByCustomer);

// get booking details
router.get('/booking/view/:id', adminGetBookingDetails);

// get service list 
router.get('/service/list', adminGetAllServiceName);

// update booking
router.patch('/booking/update/:id',adminUpdateBooking);

// admin cancel booking
router.patch('/booking/cancel/:id',adminCancelBooking);

// admin complete booking
router.patch('/booking/complete/:id',adminCompleteBooking);

// update profile details
router.patch('/patient/update/:id',validatePatientDetails,adminUpdatePatientDetails);

// admin get calendar event
router.post('/calendar', adminGetCalendar);

// admin mobile get calendar event
router.post('/mobile/calendar', adminGetMobileCalendar);

// admin mobile patient list
router.get('/mobile/patient/:search_filter', adminMobilePatientList);

// admin get company details 
router.get('/company/details', adminGetCompanyDetails);

// admin get geocode
router.get('/geocode/:address', adminUseGeocode);

// admin update company details 
router.patch('/company/update', adminUpdateCompanyDetails);

// admin get service list with filter
router.get('/service/list/:status_filter', adminGetAllServiceFilter);

// admin get service list with filter
router.get('/service/:id', adminGetSingleServiceDetails);

// admin get service list with filter
router.patch('/service/update/:id', adminUpdateService);

// admin get service list with filter
router.post('/service/create', adminCreateService);


module.exports = router
