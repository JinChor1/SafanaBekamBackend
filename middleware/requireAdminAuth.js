const jwt = require('jsonwebtoken')
const Admin = require('../models/adminModel')
const Company = require('../models/companyDetailsModel')

const requireAuth = async (req,res,next) => {

    // verify authentication
    const { authorization } = req.headers
    if (!authorization) {
        return res.status(401).json({error: 'Authorisation token required'})
    }

    const token = authorization.split(' ')[1]

    try {
        const { _id, companyId } = jwt.verify(token, process.env.SECRET_JWT)

        req.adminId = await Admin.findOne({_id}).select('_id')
        req.companyId = await Company.findOne({_id: companyId}).select('_id')
        next()
         
    } catch (err) {
        if (err.name == "TokenExpiredError") {
            res.status(401).json({error: 'Log in session is expired. Please log in again'})
        } else {
            res.status(401).json({error: 'Request is not authorised'})
        }
    }
}

module.exports = requireAuth