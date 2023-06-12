const express = require('express');
const router = express.Router();
const {
    createCompanyDetails,
    getAllCompanyDetails,
    getCompanyDetails,
    deleteCompanyDetails,
    updateCompanyDetails
} = require('../controllers/companyDetailsController');

// get all company details
router.get('/', getAllCompanyDetails);

// get single company details
router.get('/:id',getCompanyDetails);

// post company details
router.post('/',createCompanyDetails);

// // delete a company details
// router.delete('/:id',deleteCompanyDetails);

// // update company details
// router.patch('/:id',updateCompanyDetails);

module.exports = router;