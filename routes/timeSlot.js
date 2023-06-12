const express = require('express');
const router = express.Router();
const {
    getTimeSlot,
    addBooking,
    getBookingByCustomer
} = require('../controllers/timeSlotController');
const requireAuth = require('../middleware/requireAuth');

// require for all route
router.use(requireAuth);

// get company available timeslot
router.get('/', getTimeSlot);

// add booking
router.post('/', addBooking);

// get customer booking
router.get('/getBookingByCustomer/:page', getBookingByCustomer);

module.exports = router;