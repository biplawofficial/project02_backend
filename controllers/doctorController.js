//importing all the necessary modules that are required.
const bookings = require("../models/booking");
const DoctorAvailability = require("../models/doctorAvalability");
const mongoose = require('mongoose');


/*
This api will insert or update if present the doctor avaliability of the doctor to the doctorAvalibility collections.The apu is restricted 
it as we are extracting the doctorId from the jwt token.
*/
submitDoctorAvailability = async ( req,res)=>{
    const doctorId=req.data.user.id
    const data = new DoctorAvailability({
        doctor_id: doctorId,
        time_slot: req.body.time_slot,
        morning: {
            from: req.body.morning.from,
            to: req.body.morning.to
        },
        afternoon: {
            from: req.body.afternoon.from,
            to: req.body.afternoon.to
        },
        evening: {
            from: req.body.evening.from,
            to: req.body.evening.to
        }
    });
    try {
        const findFirst = await DoctorAvailability.findOne({ doctor_id: doctorId });
        if (!findFirst) {
            const savedData = await data.save();
            res.status(200).json({ data: savedData });
        }
        else {
            const savedData = await DoctorAvailability.findOneAndUpdate({doctor_id: doctorId}, { ...req.body }, { new: true });
            res.status(200).json({ data: savedData });
        }
    } catch (error) {
        res.status(500).json({ status:500 });
    }
}


/*
This api will return all the bookings and patient details assoicated to that particular bookings of the current date 
to which api is called getcurrentbookings.The api is restricted to the doctor as we are checking the doctor and and extracting the id from the 
jwt token.
*/
getCurrentBookings = async(req,res)=>{
    if(req.data.user.role == "doctor"){
        const id = req.data.user.id
        const date =new Date()
        date.setHours(0,0,0,0)
        try {
            const patientBookings = await bookings.aggregate([{$match: {$and:[{ bookingDate: { $eq: date }},{ doctor_id: new mongoose.Types.ObjectId(id)}]}},
            {
                $lookup: {  // lookup is used to find the patient details from the users collections associated to the booking.
                  from: 'users', 
                  localField: 'patient_id',
                  foreignField: '_id',
                  as: 'patientdetails'
                }
              } 
         ])
        
            res.status(200).json(patientBookings)
        } catch (error) {
            res.status(500).json({status:500});
        }
    }
    else{
        res.status(400).json({status:401})
    }
}


/*
This api will save the prescition of the patient associated to the bookingId that is passed from the frontend.The api is restricted to the doctor only as 
we are checking the role and extracting the id from the jwt token.The api is accepting the bookingId from the frontend as in body.It first find the 
bookings associated to the doctorId and bookingId and then add the prescritpion to it and save it.
*/
addDetailsToPatient = async(req,res)=>{
    if(req.data.user.role == "doctor"){
        try {
        const doctorId = req.data.user.id
        const {bookingId} = req.body
        const data = await bookings.findOne({doctor_id:doctorId,_id:bookingId})
        if(!data)
          return res.status(200).json({status:209})
        data.prescription=req.body.prescription
        const updatedData = await data.save()
        res.status(200).json(updatedData)
        } catch (error) {
            res.status(500).json({status:500});
        }
    }
    else{
        res.status(400).json({status:401})
    }
}



//exporting all the functions to that it can be used in doctors.
module.exports={
    submitDoctorAvailability,
    getCurrentBookings,
    addDetailsToPatient
    
}