//importing all the necessary modules that are required.
const userModel = require('../models/users')
const inventoryModel = require('../models/inventory');
const { get } = require('mongoose');
const Bookings = require('../models/booking')


/*
this function will get all the doctors whose approval is 1 as all the doctors whose approval is 1 their profile is pending for approval.
As we have to restrict the api to only admin we have check the token if tis admin then only will be processing it.
*/
getApprovalRequestList = async(req,res)=>{
    if(req.data.user.role === "admin"){ // checking the token if it is from admin or not
    try {
        const doctorsList = await userModel.find({ role: 'doctor', approval: 1 });
        res.status(200).json({ status : 200,doctorsList: doctorsList });
    } catch (error) {
        //got error while doing server thing if you want to check either use some debug tool or console.log(error) here
        res.status(404).json({status:500});
    }
     }
    else{
    //send this code when the access user is not admin
    res.status(400).json({ status: 401 });
   }
}


/*
This api will approve the doctor profile i.e approval = 2 and we have to make the api restricted by checking the role in the jwt token is from admin or not 
after than as the approve doctor is post request and it accepts the _id in the body of the request and approval from the request body as admin can approve i. approval =2 or admin
can reject that is admin approval = 0 and will update it to the database.
*/
approveDoctor = async(req,res)=>{
    if(req.data.user.role == "admin"){
    try{
        const {_id} = req.body
        const updateData ={
            approval:req.body.approval
        }
          await  userModel.findByIdAndUpdate(_id,updateData,{ new: true }) // making it {new:true} is to the query should return the updated docuements.
        res.status(200).json({status:200})
    
    }catch(error){
        //got error while doing server thing if you want to check either use some debug tool or console.log(error) here
        res.status(500).json({status:500})
    
    }
    }
    else{
        //send this code when the access user is not admin
        res.status(400).json({status:401})
    }
}


/*
This api will return the doctor details of the sent id that is sent in query in get request and its a restricted api as we are checking the role from the 
jwt toekn as admin.
*/
getDoctorDetails=async(req,res)=>{
    if(req.data.user.role == "admin"){
        try{
            const id = req.query.id
            const userDetails =await userModel.findById({_id:id})
            res.status(200).json(userDetails)
        }catch(error){
            //got error while doing server thing if you want to check either use some debug tool or console.log(error) here
            res.status(500).json({status:500}) 
        }
        }
        else{
            //send this code when the access user is not admin
            res.status(400).json({status:401})
        }
}

/*
This function will return all the medicine inventories and it is restricted to the admin role as we are checking the role as admin from the jwt token.

*/
getAllInventory = async (req,res)=>{
    if(req.data.user.role == "admin"){
        try{
            const inventoryDetails =await inventoryModel.find()
            res.status(200).json(inventoryDetails)
        }catch(error){
            //got error while doing server thing if you want to check either use some debug tool or console.log(error) here
            res.status(500).json({status:500}) 
        }
        }
        else{
            //send this code when the access user is not admin
            res.status(400).json({status:401})
        }
}

/*
This function will accept the medicine_name and available_quantity as body in the request and it will find the document in the inventory collection 
with medicine_name and update it with available_quantity.And one more this we are also changing the medicine_name to lowercase for making our 
database consistent.
*/
updateInventory = async(req,res)=>{
    if(req.data.user.role == "admin"){
        try{
             req.body.medicine_name = req.body.medicine_name.toLowerCase()
            const inventoryDetails =await inventoryModel.findOneAndUpdate({medicine_name:req.body.medicine_name},req.body,{ new: true }) // {new:true} so that after updating the document it will return the updated document.
            res.status(200).json(inventoryDetails)
        }catch(error){
            //got error while doing server thing if you want to check either use some debug tool or console.log(error) here
            res.status(500).json({status:500}) 
        }
        }
        else{
            //send this code when the access user is not admin
            res.status(400).json({status:401})
        }
}



/*
This function wll bulk update and insert if it does not exisits.It will accept the json array containing the  medicine_name and available_quantity and update 
the available_quantity if medicine_name exists else insert it .Api is restricted to admin only as we are checking the role of admin from 
jwt token. 
*/
bulkInsertInventory = async(req,res)=>{
    if(req.data.user.role == "admin"){
    try{
    const doc = req.body.data
    doc.forEach(obj => {
        obj.medicine_name=obj.medicine_name.toLowerCase()   //making all medicine name to lowercase
      });
    const result = await inventoryModel.bulkWrite(          //bulkwrite will take all the queries and will run all the queries at once.
        doc.map(obj => ({
            updateOne: {
                filter: { medicine_name: obj.medicine_name },
                update: { $set: obj },
                upsert: true                                //{upsert:true} it indicate moongoose that if it does not present then insert it.
            }
        }))
    );
    res.status(200).json({status:200})
    }catch(error){
        res.status(500).json({status:500}) 
    }
    }
    else{
        res.status(400).json({status:401})
    }
}


/*
Api will return the unqiue patient of each doctor.This will achieve by grouping the patient according to the doctor and add patient to set and 
count it.The api uses aggregate pipeline in which we can give multiple commands one by one to mongoDb and it will run one after another 
and one thing more that the output of one query will be th input to the next query.You can check each state output by comminting all below queries to it.
*/
getTotalPatientByDoctor = async (req,res) =>{
        try{
  

 const details=  await Bookings.aggregate([
  {
    $group: {                                        //group operator which will group the documents accoridng to _id.
      _id: '$doctor_id',                            //we have to initialize _id which the key name to which we have initliaze it.
      uniquePatients: { $addToSet: '$patient_id' },  // adding the patient to the set so that only we will have patient once .
    }
  },
  {
    $project: {                                   //project operator will works similar to select in sql
      _id: 1,                                     //As i have told you that output of one query will be input to another as output of $group will be input to $project.
      uniquePatientCount: { $size: '$uniquePatients' },  //_id 1 indicate that keep _id as it and   uniquePatientCount: { $size: '$uniquePatients' } indicate find the size of each set associated _id.
    }
  },
  {
    $lookup: {                            // As we have to send doctor details to frontend , we use lookup operator to find the details from other collection to which it associated it with.        
      from: 'users',
      localField: '_id',
      foreignField: '_id',
      as: 'doctorDetails'               // this is saying that the details will be indicated as doctorDetails in the final output.
    }
  },
  {
    $unwind: "$doctorDetails" // To deconstruct the array from the lookup
  }
])
        res.status(200).json(details)
        }catch(error){
            res.status(500).json({status:500}) 
        }
   
}

/*
The api will get the total bookings date wise from the latest date of the booking to the last 10 days ,This is achieved by finding the max date 
of booking and then filtering out the documents whose booking dates are greater than the maxdate-9 and then group it according to date.You can check each state output by comminting all below queries to it
*/
getTotalPAtientByDate = async (req,res)=>{
    try{
        const date = await Bookings.aggregate([{ $group: { _id: null, maxDate: { $max: "$bookingDate" } } }]) //find the max date by combing all the documents to one array and find it the max date from it the output of the query will be like [{_id:null,maxdate:date}]
        if(date.length == 0)    //checking if there is booking or not.
           res.status(200).json({status:210})
        const maxDate = date[0].maxDate   
        maxDate.setHours(0, 0, 0, 0) 
        maxDate.setDate(maxDate.getDate() -9);
        const details=  await Bookings.aggregate([
            {
              $match: {          //match operator works like filter or where in sql.
                bookingDate: {
                  $gte: new Date(maxDate)  //gte is greater than equal
                }
              }
            },
            {
              $group: {             //group operator.
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$bookingDate" }  //defining the output format _id and inializing the _id so that it can group according to _id
                },
                totalPatients: { $sum: 1 }   // this indicate count the all the elements in array associated to _id. 
              }
            },
            {
              $sort: { _id: 1 }  //sort according to the date.
            }
          ]);
          const transformedResult = details.reduce((acc, current) => {  // just reframing the output according to the frontend.
            acc[current._id] = { totalPatients: current.totalPatients };
            return acc;
          }, {});

          res.status(200).json(transformedResult)
        }catch(error){
            res.status(500).json({status:500}) 
        }
}


/*
Exporting all the functions so that it can be use adminRoute.
*/
module.exports = {
    getApprovalRequestList,
    approveDoctor,
    getDoctorDetails,
    getAllInventory,
    updateInventory,
    bulkInsertInventory,
    getTotalPatientByDoctor,
    getTotalPAtientByDate
}