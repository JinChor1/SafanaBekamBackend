const CompanyDetails = require('../models/companyDetailsModel');
const mongoose = require('mongoose');
const fetch = require("node-fetch");

// get all company details
const getAllCompanyDetails = async (req,res) => {
    const companyDetails = await CompanyDetails.find({}).sort({updatedAt: -1 })
    res.status(200).json(companyDetails);
}

// get single company details
const getCompanyDetails = async (req,res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: "No company found!"});
    }

    const companyDetails = await CompanyDetails.findById(id);

    if (!companyDetails) {
        return res.status(404).json({error: "No company found!"})
    }

    res.status(200).json(companyDetails);
}

// post company details
const createCompanyDetails = async (req,res) => {
    try {
        const companyDetails = await CompanyDetails.create(req.body);
        res.status(200).json(companyDetails);
    } catch (err) {
        res.status(400).json({error: err.message});
    }
}

// delete a company details
const deleteCompanyDetails = async (req,res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: "No company found!"});
    }

    const companyDetails = await CompanyDetails.findByIdAndDelete(id);

    if (!companyDetails) {
        return res.status(400).json({error: "No company found!"})
    }

    res.status(200).json(companyDetails);
}

// update company details
const updateCompanyDetails = async (req,res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: "No company found!"});
    }

    const companyDetails = await CompanyDetails.findOneAndUpdate({ _id : id}, {
        ...req.body
    },{
        runValidators: true,
    });

    if (!companyDetails) {
        return res.status(400).json({error: "No company found!"})
    }

    res.status(200).json(companyDetails);
}

const adminGetCompanyDetails = async (req,res) => {
    const id = req.companyId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: "No company found!"});
    }

    const companyDetails = await CompanyDetails.findById(id);

    if (!companyDetails) {
        return res.status(404).json({error: "No company found!"})
    }

    res.status(200).json(companyDetails);
}

const adminUseGeocode = async (req,res) => {
    try {
        const { address } = req.params
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.SECRET_GOOGLE_KEY}`)
        const googleGeoAPI = await response.json();

        if (googleGeoAPI.status === "ZERO_RESULTS") {
            return res.status(404).json({error: "No address found"})
        }

        if (googleGeoAPI.status !== "OK") {
            return res.status(400).json({error: googleGeoAPI.error_message})
        }

        res.status(200).json(googleGeoAPI);
    } catch (err) {
        res.status(400).json({error: err.message});
    }
}

const adminUpdateCompanyDetails = async (req,res) => {
    const id = req.companyId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: "No company found!"});
    }

    const companyDetails = await CompanyDetails.findOneAndUpdate({ _id : id}, {
        ...req.body
    },{
        new: true,
        runValidators: true,
    });

    if (!companyDetails) {
        return res.status(400).json({error: "No company found!"})
    }

    res.status(200).json(companyDetails);
}

module.exports = {
    createCompanyDetails,
    getAllCompanyDetails,
    getCompanyDetails,
    deleteCompanyDetails,
    updateCompanyDetails,
    adminGetCompanyDetails,
    adminUseGeocode,
    adminUpdateCompanyDetails
}