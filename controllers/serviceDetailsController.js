const ServiceDetails = require('../models/serviceDetailsModel');
const Patient = require('../models/patientModel')
const mongoose = require('mongoose');

// get all service details
const getAllServiceDetails = async (req,res) => {
    const serviceDetails = await ServiceDetails.find({companyId: req.companyId, serviceStatus: "Active"}).sort({updatedAt: -1 })
    console.log(serviceDetails)
    const userEligible = await Patient.findById(req.patientId).select('patientEligible')

    if (!userEligible.patientEligible) {
        return res.status(200).json({warning: "Account is ineligible for booking, please complete demography details first."});
    }
    
    res.status(200).json(serviceDetails);
}

// get single service details
const getServiceDetails = async (req,res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: "No service found!"});
    }

    const serviceDetails = await ServiceDetails.findById(id);

    if (!serviceDetails) {
        return res.status(404).json({error: "No service found!"})
    }

    // jwt authorisation
    if (JSON.stringify(serviceDetails.companyId) !== JSON.stringify(req.companyId._id)) {
        return res.status(401).json({error: "Authorisation failed"})
    }

    res.status(200).json(serviceDetails);
}

// post service details 
const createServiceDetails = async (req,res) => {
    try {
        const serviceDetails = await ServiceDetails.create(req.body);
        res.status(200).json(serviceDetails);
    } catch (err) {
        res.status(400).json({error: err.message});
    }
}

// delete a service details 
const deleteServiceDetails = async (req,res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: "No service found!"});
    }

    const serviceDetails = await ServiceDetails.findByIdAndDelete(id);

    if (!serviceDetails) {
        return res.status(400).json({error: "No service found!"})
    }

    res.status(200).json(serviceDetails);
}

// update service details 
const updateServiceDetails = async (req,res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: "No service found!"});
    }

    const serviceDetails = await ServiceDetails.findOneAndUpdate({ _id : id}, {
        ...req.body
    });

    if (!serviceDetails) {
        return res.status(400).json({error: "No service found!"})
    }

    res.status(200).json(serviceDetails);
}

// admin get service list 
const adminGetAllServiceName = async (req,res) => {
    const serviceDetails = await ServiceDetails.find({companyId: req.companyId, serviceStatus: "Active"},['serviceName'])
    
    if (!serviceDetails){
        return res.status(400).json({error: "No service found!"})
    }
    
    res.status(200).json(serviceDetails);
}

// admin get service list 
const adminGetAllServiceFilter = async (req,res) => {
    const { status_filter } = req.params

    const serviceDetails = await ServiceDetails.find({
        companyId: req.companyId, serviceStatus: status_filter==="null"? {$ne:status_filter}: status_filter 
    },['serviceName','serviceStatus','serviceDuration','servicePrice','serviceDesc','servicePic'])
    
    if (!serviceDetails){
        return res.status(400).json({error: "No service found!"})
    }
    
    res.status(200).json(serviceDetails);
}

// get single service details
const adminGetSingleServiceDetails = async (req,res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: "No service found!"});
    }

    const serviceDetails = await ServiceDetails.findOne({_id: id, companyId: req.companyId});

    if (!serviceDetails) {
        return res.status(404).json({error: "No service found!"})
    }

    // jwt authorisation
    if (JSON.stringify(serviceDetails.companyId) !== JSON.stringify(req.companyId._id)) {
        return res.status(401).json({error: "Authorisation failed"})
    }

    res.status(200).json(serviceDetails);
}

const adminUpdateService = async (req,res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({error: "No service found!"});
    }

    const serviceDetails = await ServiceDetails.findOneAndUpdate({ _id : id, companyId: req.companyId}, {
        ...req.body
    },{new: true});

    if (!serviceDetails) {
        return res.status(400).json({error: "No service found!"})
    }

    res.status(200).json(serviceDetails);
}

// admin post service 
const adminCreateService = async (req,res) => {
    try {
        const formatBody = {
            ...req.body,
            companyId: req.companyId,
            servicePic: "https://69364-fyp-system.s3.ap-southeast-1.amazonaws.com/coveerpage.png.jpg"
        }

        const serviceDetails = await ServiceDetails.create(formatBody);
        res.status(200).json(serviceDetails);
    } catch (err) {
        res.status(400).json({error: err.message});
    }
}


module.exports = {
    createServiceDetails,
    getAllServiceDetails,
    getServiceDetails,
    deleteServiceDetails,
    updateServiceDetails,
    adminGetAllServiceName,
    adminGetAllServiceFilter,
    adminGetSingleServiceDetails,
    adminUpdateService,
    adminCreateService
}