// dependencies
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const companyDetailsRoutes = require('./routes/companyDetails');
const serviceDetailsRoutes = require('./routes/serviceDetails');
const patientRoutes = require('./routes/patient');
const timeSlotRoutes = require('./routes/timeSlot');
const adminRoutes = require('./routes/admin');

// express
const app = express();

// midleware
app.use(express.json()); /* pass data to req.body */
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    console.log(req.path, req.method);
    next();
});
// routes
app.use('/api/companyDetails',companyDetailsRoutes);
app.use('/api/serviceDetails',serviceDetailsRoutes);
app.use('/api/patient',patientRoutes);
app.use('/api/timeSlot',timeSlotRoutes);
app.use('/api/admin',adminRoutes);

// invalid route
app.use('/*', function(req,res){
    res.status(404).json({error: "Invalid route"})
})

// mongodb connection
const uri = process.env.ATLAS_URI;
mongoose.connect(uri)
    .then(()=>{
        // server run (after connected to db)
        const port = process.env.PORT;
        app.listen(port, () => {
            console.log(`Server is running on port: ${port}`);
        });
    })
    .catch((err)=>{
        console.log(err);
    })

const connection = mongoose.connection;
connection.once('open', () => {
    console.log("MongoDB database connection established successfully");
});


