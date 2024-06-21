//importing all the necessary modules that are required.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// this is the secret key that will used to bulild a jwt token and same it will be used to verify the jwtsecretkey.
const jwtSecretKey = "qwertyuiopasdfghjklzxcvbnmqwerty";
const userModel = require('../models/users')
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const otpModel = require('../models/otp')


// this is used for sending otp to mail.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'udaydebnath999999@gmail.com', // this is the email that will be used to send the email.
        pass: 'cpsg pyzm egez dkvq', //this is the password that is created in app passwords in gmail setting options.
    },
});


/*
login function used to login the user.
It accepts the email and password in body.Then it finds the document corresponding to that email and if it does not find it sends back 
the response and if it is find it compares the password with the encrypted password and if it matches and it will create the jwttoken 
which we have user object which contain id and role.
*/
login = async (req,res)=>{
    let email = req.body.email;
    let pwd = req.body.password;
    try {
        const data = await userModel.findOne({ email });
        if (!data) {
            return res.status(400).json({ message: "please enter correct credentials" });
        }
        if(data.user_verify == 0){
            res.status(400).json({status:202})
        }
        const password = await bcrypt.compare(pwd, data.password);
        if (!password) {
            return res.status(400).json({ message: "please enter correct password" });
        }
        const key = { user: { id: data.id ,role:data.role} };
        const options = {
            expiresIn: '1d',
          };
        
        const authToken = jwt.sign(key, jwtSecretKey,options); // creating the jwt token.
        return res.json({ userData: data, authToken: authToken });
    } catch (error) {
        // this will be send if the runtime error occurs in the code and if it those try to console it to get the exact route.
        res.status(500).send({status:500});
    }
  }



/*
This api will make user registered to the platform .The api accepts name , email,role and password in the req body.The function will first 
verfies the otp and if it does then it insert the details to the user collections.
*/
register = async(req,res)=>{
    try{
        const { name,email,role ,password,otp} = req.body;
        let otpuser = await otpModel.findOne({ email });
        if (otpuser){
            if (otpuser.otpExpires < new Date()) {
                // send response that otp expires
                return res.status(200).json({status:202 });
            }
            if (otpuser.otp !== otp){
                //send response for invalid otp
                return res.status(200).json({status:203})
            }
            else{
            let user = await userModel.findOne({ email });  // checking the email exists or not.
            if(!user){
                await otpModel.findOneAndDelete({ email }); // deleting the otp details from the otp collections.
                const salt = await bcrypt.genSalt(10);   // encrypting the password.
                const secPassword = await bcrypt.hash(password, salt);
                const data = new userModel(
                              {
                                  name: name,
                                  email: email,
                                  password: secPassword,
                                  role: role
                              }
                          );
                          savedData=await data.save();
                  // send response for successfull regestration
                  res.status(200).json(savedData);
              }
              else {
                  //send response already registered
                  res.status(200).send({status:204});
              }
            }
        }
        else{
            //invalid request
            res.status(200).send({status:206});
        }
    }
    catch(error){
          // this will be send if the runtime error occurs in the code and if it those try to console it to get the exact route.
          res.status(500).send({status:500});
    }
}

/*
This function will send the otp , the only difference is that it does not send the otp to the new users who came first time to the platform.
*/
resendOtp = async(req,res)=>{
    
    const { email } = req.body;
    const charset = '0123456789';
    const otp =randomstring.generate({
               length: 6,
               charset: charset,
        });
    try{
        const userdata = await userModel.findOne({ email });
        if(userdata){
        const otpExpires = new Date();
        otpExpires.setMinutes(otpExpires.getMinutes() + 5);
        userdata.otp=otp
        userdata.otpExpires=otpExpires
        await userdata.save()
        }
        else{
           const newOtp = await otpModel.findOne({email})
           const otpExpires = new Date();
           otpExpires.setMinutes(otpExpires.getMinutes() + 5);
           if(newOtp){
               await otpModel.updateOne({ email: email }, { $set: { otp: otp, otpExpires: otpExpires } });
           }else{
             //invalid request
             res.status(200).send({status:206});
            
           }
           
          
        }
        const mailOptions = {
            from: 'otp788935@gmail.com',
            to: email,
            subject: 'OTP for Registration',
            text: `Your OTP for registration is ${otp}`,
        };
       await transporter.sendMail(mailOptions);
       res.status(200).send({status:200});
    }
    catch(error){
          // this will be send if the runtime error occurs in the code and if it those try to console it to get the exact route.
          res.status(500).send({status:500});
    }
}

/*
This api will be called at the time of login and it will verify the otp and if it verfied then it will generate the jwt token and send the details of the user 
*/
verifyOtp = async(req,res)=>{
    const { email, otp } = req.body;
    try {
        let user = await userModel.findOne({ email });     // check if it is a registered user or not.
        if (!user) {
            //send otp if user does not exist
            return res.status(200).json({status:207});
        }
        if (user.otpExpires < new Date()) {
               // send response that otp expires
               return res.status(200).json({status:202 });
        }
        if (user.otp !== otp) {
            //send response for invalid otp
            return res.status(200).json({status:203})
        }
        user.otp = undefined;                // removing the details of the otp from the user collection.
        user.otpExpires = undefined;
        await user.save();
        const key = { user: { id: user.id ,role:user.role} };   // generating a jwt token.
        const options = {
            expiresIn: '1d',
          };
        
        const authToken = jwt.sign(key, jwtSecretKey,options);
        return res.json({ userData: user, authToken: authToken });
    } catch (err) {
          // this will be send if the runtime error occurs in the code and if it those try to console it to get the exact route.
          res.status(500).send({status:500});
    }
}


/*
This api will send the otp to both registered and unregisterd users.If the user is regustered its otp details will be save to the user collection 
and if it is unregistered then it will be save to otp collection.The api accepts the email in req body to which otp has to be sent.It also checks that
if the unregistered user is first time on the platform and if its does not then instead of inserting ,it updates in otpmodel.
*/
sendOtp = async(req,res)=>{
    const { email } = req.body;
    const charset = '0123456789';                
    const otp =randomstring.generate({       // genrate a otp of length 6
               length: 6,
               charset: charset,
        });
    try{
        const userdata = await userModel.findOne({ email });  // checking if it is a registered user.
        if(userdata){                             // if it is update the otp in user collection.
        const otpExpires = new Date();
        otpExpires.setMinutes(otpExpires.getMinutes() + 5);  //generate the otp expieres time of 5 min.
        userdata.otp=otp
        userdata.otpExpires=otpExpires
        await userdata.save()
        }
        else{                                       // if it does not then check the unregistered user is for the first time or not 
           const newOtp = await otpModel.findOne({email})
           const otpExpires = new Date();
           otpExpires.setMinutes(otpExpires.getMinutes() + 5);//generate the otp expieres time of 5 min.
           if(newOtp){
               await otpModel.updateOne({ email: email }, { $set: { otp: otp, otpExpires: otpExpires } }); // if its not first time then update it 
           }else{
            await new otpModel({        // if its first time insert it to the otp collections.
                email:email,
                otp:otp,
                otpExpires:otpExpires
             }).save()
           }
           
          
        }
        const mailOptions = {
            from: 'otp788935@gmail.com',
            to: email,
            subject: 'OTP for Registration',
            text: `Your OTP for registration is ${otp}`,
        };
       await transporter.sendMail(mailOptions);
       res.status(200).send({status:200});
    }
    catch(error){
         // this will be send if the runtime error occurs in the code and if it those try to console it to get the exact route.
         res.status(500).send({status:500});
    }
}


/*
This will send the details of user collection of the id it is extracted from the jwt token.
*/
userDetails = async (req,res) =>{
    try {
        const id = req.data.user.id;
        const userDetail = await userModel.findById( id );
        console.log(userDetail)
        res.status(200).json({ status: 200, userData: userDetail });
    } catch (error) {
          // this will be send if the runtime error occurs in the code and if it those try to console it to get the exact route.
          res.status(500).send({status:500});
    }
}




/*
This api will update the details of the user.The api is restricted as we are extracting the id from the jwt token.The approval status will 
change when fee_per_cosnultation,workex,qualifications,specilization is changed only/
*/
updateDetails = async(req,res)=>{
   try{
    const id = req.data.user.id
    const newProfileImage = req.file ? { profile_image: req.file.filename } : {};  // we have uploaded the image using multer and after successful uploading it generates the path ,its just checking if the image was also uploaded with calling this api if it is update profile_image.
        const existingData = await userModel.findById({ _id: id });
        if (existingData.fee_per_consultation !== req.body.fee_per_consultation
            || existingData.work_experience !== req.body.work_experience
            || existingData.qualification !== req.body.qualification
            || existingData.specialization !== req.body.specialization) {
            req.body.approval = 1;
        }
        const userData = await userModel.findByIdAndUpdate(id, { ...req.body, ...newProfileImage }, { new: true });
        res.status(200).json({ data: userData });
    
   }
   catch(error){
     // this will be send if the runtime error occurs in the code and if it those try to console it to get the exact route.
     res.status(500).send({status:500});
   }
}



/*
This api will change the password.The api accepts email,password and otp in the request body.
*/
changePassword = async (req,res)=>{
    try{
          const {email,password,otp} = req.body;  
          const userdata = await userModel.findOne({ email });  // checking the user exists or not.
          if(!userdata){
               return res.status(200).json({"status":207});
          }
          if (userdata.otpExpires < new Date()) {        // checking the time if it less than otp expiers time.
               // send response that otp expires
                return res.status(200).json({status:202 });
          }
          if (userdata.otp !== otp) {             // checking the otp is same or not.
              //send response for invalid otp
                return res.status(200).json({status:203})
          }
          userdata.otp = undefined;                // if it is same then remove the otp and otp experies time.
          userdata.otpExpires = undefined;
          const salt = await bcrypt.genSalt(10);
          const secPassword = await bcrypt.hash(password, salt); // encrypt the password.
          userdata.password=secPassword
          await userdata.save();               // update the user collection.
          res.status(200).json({status:200})
        }
    catch(error){
          // this will be send if the runtime error occurs in the code and if it those try to console it to get the exact route.
          res.status(500).send({status:500});
    }
}


/*
This api will be called in case of forgotpassword ,it will generate otp and otp expiers time and udpate it to the user collection and send the 
otp to the email.
*/
sendOtppassword = async(req,res)=>{
    const { email } = req.body;
    const charset = '0123456789'; 
    const otp =randomstring.generate({   // generating the random string of length 6 and in numeric.
               length: 6,
               charset: charset,
        });
    try{
        const userdata = await userModel.findOne({ email }); // checking the email exists or not .
        if(!userdata){
            res.status(200).json({"status":207});
        }

        //this will be called when only email exists
        const otpExpires = new Date(); 
        otpExpires.setMinutes(otpExpires.getMinutes() + 5); // genreating the otp expirers time of 5 minuters.
        userdata.otp=otp
        userdata.otpExpires=otpExpires
        await userdata.save()
        const mailOptions = {  // defining the otp mail structure.
            from: 'otp788935@gmail.com',
            to: email,
            subject: 'OTP for Registration',
            text: `Your OTP for registration is ${otp}`,
        };
       await transporter.sendMail(mailOptions); // sending mail.
       res.status(200).send({status:200});
    }
    catch(error){
        // this will be send if the runtime error occurs in the code and if it those try to console it to get the exact route.
        res.status(500).send({status:500});
    }
}



// exporting alll functions so that it can be used in userroute.
module.exports={
    register,
    login,
    sendOtp,
    resendOtp,
    verifyOtp,
    userDetails,
    updateDetails,
    changePassword,
    sendOtppassword
}