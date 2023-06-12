const validator = require("validator")
const mykad = require('mykad');
const myPostCode = require('malaysia-postcodes')

const raceValidate = [
    "Malay", "Kadazan Dusun", "Bajau",
    "Murut", "Iban", "Bidayuh", 
    "Melanau", "Other Bumiputera", "Chinese", 
    "Indian", "Other Malaysian Citizen"
]
const sexValidate = ["Male","Female"]
const stateValidate = [
    "Johor", "Kedah", "Kelantan", "Melaka",
    "Negeri Sembilan", "Pahang", "Perak",
    "Perlis", "Sabah", "Sarawak",
    "Selangor", "Terengganu", "Wp Kuala Lumpur",
    "Wp Labuan", "Wp Putrajaya"
]
const occupationValidate = [
    "Agriculture", "Utilities", "Finance",
    "Entertainment","Education", "Health care",
    "Information services", "Data processing", "Food services",
    "Hotel services", "Legal services", "Publishing",
    "Military", "Other", "Prefer not to say"
]

const validatePatientDetails = async (req,res,next) => {
    try {
        const patient = req.body
        const invalidField = []
        const ineligibleField = []

        // email
        if (!validator.isEmail(patient.patientEmail)){
            invalidField.push("patientEmail")
            ineligibleField.push("patientEmail")
        }

        // Name
        if (!patient.patientName){
            ineligibleField.push("patientName")
        } 

        // myKad
        if (patient.patientNoMyKad && !mykad.isValid(patient.patientNoMyKad)){
            invalidField.push("patientNoMyKad")
            ineligibleField.push("patientNoMyKad")
        } 
        if (!patient.patientNoMyKad){
            ineligibleField.push("patientNoMyKad")
        }

        // sex
        if (patient.patientGender && !sexValidate.includes(patient.patientGender)){
            invalidField.push("patientGender")
            ineligibleField.push("patientGender")
        } 
        if (!patient.patientGender){
            ineligibleField.push("patientGender")
        } 

        // race 
        if (patient.patientRace && !raceValidate.includes(patient.patientRace)){
            invalidField.push("patientRace")
            ineligibleField.push("patientRace")
        } 
        if (!patient.patientRace){
            ineligibleField.push("patientRace")
        } 

        // occupation 
        if (patient.patientOccupation && !occupationValidate.includes(patient.patientOccupation)){
            invalidField.push("patientOccupation")
            ineligibleField.push("patientOccupation")
        } 
        if (!patient.patientOccupation){
            ineligibleField.push("patientOccupation")
        }

        // phone number
        if (patient.patientPhone && !validator.isMobilePhone(patient.patientPhone ,'ms-MY')){
            invalidField.push("patientPhone")
            ineligibleField.push("patientPhone")
        }
        if (!patient.patientPhone){
            ineligibleField.push("patientPhone")
        } 

        // address 
        if (!patient.patientAddress){
            ineligibleField.push("patientAddress")
        } 

        // postal code
        if (!patient.patientPostcode){
            ineligibleField.push("patientPostcode")
        } else {
            const postalValidate = myPostCode.findPostcode(patient.patientPostcode)
            if (postalValidate.found === false || postalValidate.state !== patient.patientState) {
                invalidField.push("patientPostcode")
                ineligibleField.push("patientPostcode")
            }
        }

        // state
        if (patient.patientState && !stateValidate.includes(patient.patientState)){
            invalidField.push("patientState")
            ineligibleField.push("patientState")
        } 
        if (!patient.patientState){
            ineligibleField.push("patientState")
        } 

        if (invalidField.length === 0){
            req.ineligibleField = ineligibleField
            next()
        } else {
            res.status(400).json({error: 'Please recheck details for correct input', errorData: invalidField})
        }
    } catch (e) {
        res.status(400).json({error: e.message})
    }
}   

module.exports = validatePatientDetails