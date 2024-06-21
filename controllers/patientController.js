//importing all the necessary modules that are required.
const userModel = require('../models/users')
const Bookings = require('../models/booking')
const DoctorAvailability = require('../models/doctorAvalability');
const mongoose = require('mongoose');

/*
This api will return the doctor whose approval =2 .
*/
getApprovedDoctors = async(req,res)=>{
    try {
        const doctorData = await userModel.find({approval:2});
        res.status(200).json(doctorData);
    } catch (error) {
        res.status(500).json({status:500});
    }
}


/*
This api will return the doctor timmings from the doctoravaibility collection according to the doctor_id.
*/
getDoctorAvailablity = async(req,res)=>{
    const id = req.query.id
    try {
        const data = await DoctorAvailability.findOne({doctor_id:id});
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({status:500});
    }
}



/*
This api will return booked slots by finding all the bookings from the current bookings to the next 7 days.
*/
getAlreadyBookedslots = async (req,res) =>{
    const id= req.query.id;
    try {
        const now = new Date();
        now.setHours(0, 0, 0, 0)
        const next7Days = new Date();
        next7Days.setDate(now.getDate() + 7);
        const data = await Bookings.find({doctor_id:id,bookingDate: {
            $gte: now,
            $lt: next7Days
          }});
        res.status(200).json({data:data});
    } catch (error) {
        res.status(500).json({status:500});
    }
}

/*
This api will insert the booking to the booking collection, the api is restricted to the patient role ony as we are checking the role patient 
from the jwt token and extracting the patient id from the jwt token.The request also accepts the doctor_id,booking date and booking slot in the bpdy of the request.
*/
submitBookings = async (req,res)=>{
    if(req.data.user.role == "patient"){
    const id = req.data.user.id
    req.body.patient_id = id
    const dateObject = new Date(req.body.bookingDate);
    dateObject.setHours(0,0,0,0)
    req.body.bookingDate=dateObject
    try {
        const data = new Bookings(req.body);
        const savedData = await data.save();
        res.status(200).json(savedData);
    } catch (error) {
        res.status(500).json({status:500});
    }
}
else{
    res.status(400).json({status:401})
}
}


/*
This api will return all the bookings of the patient group by doctor and also send the doctor details if the patient booked the appointment to that particular 
doctor.The api is restricted as we are extracting the id from the jwt token.
*/
getAllBookings = async (req,res)=>{
    try{
    const id = req.data.user.id
    const details = await  Bookings.aggregate([
        {
          $match: {                                   //match operator is like where condition.
            patient_id: new mongoose.Types.ObjectId(id)  // extracting only the documents of the patient id who called the api.
          }
        },
        {
          $group: {                                    // group operator.
            _id: "$doctor_id",                         // initalizing the _id with doctor_id so that the bookings can group according to doctor_id.
            appointments: { $push: "$$ROOT" }          // this is telling the push whole document it . the ouput of the query will be like [{_id:doctorid,appointments:[]}]
          }
        },
        {
            $lookup: {                                 //getting the details of the doctor from user ollections.
              from: 'users', 
              localField: '_id',
              foreignField: '_id',
              as: 'doctorDetails'
            }
          },
          {
            $unwind: "$doctorDetails"              //flaterning the doctordetails.
          }
      ]);
    res.status(200).json(details)
    }
    catch(error){
        res.status(500).json({status:500});
    }

}



//exporting all the functions so that it can be used in patientroutes.
module.exports ={
    getApprovedDoctors,
    getDoctorAvailablity,
    getAlreadyBookedslots,
    submitBookings,
    getAllBookings

}