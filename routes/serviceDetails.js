const express = require('express');
const router = express.Router();
const {
    createServiceDetails,
    getAllServiceDetails,
    getServiceDetails,
    deleteServiceDetails,
    updateServiceDetails,
    getAllCompanyServiceDetails
} = require('../controllers/serviceDetailsController');
const requireAuth = require('../middleware/requireAuth');

// require for all route
router.use(requireAuth);

// get all service details
router.get('/', getAllServiceDetails);

// get single service details
router.get('/:id',getServiceDetails);

// post service details
router.post('/',createServiceDetails);

// delete a service details
router.delete('/:id',deleteServiceDetails);

// update service details
router.patch('/:id',updateServiceDetails);

module.exports = router;