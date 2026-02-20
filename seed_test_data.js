require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserModel = require('./models/users');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const salt = await bcrypt.genSalt(10);
        const secPassword = await bcrypt.hash('123456', salt);

        // Seed Admin
        await new UserModel({
            name: 'Admin Test',
            email: 'admin@krita.com',
            password: secPassword,
            role: 'admin',
            user_verify: 1
        }).save();

        // Seed Doctor (Pending Approval)
        await new UserModel({
            name: 'Doctor Test',
            email: 'doctor@krita.com',
            password: secPassword,
            role: 'doctor',
            user_verify: 1,
            approval: 1,
            gender: 'Female',
            dob: '1985-05-15',
            phone: '8888888888',
            adhar_no: '1234 5678 9012',
            father_name: 'John Doe Sr',
            mother_name: 'Jane Doe',
            marital_status: 'Single'
        }).save();

        // Seed Patient
        await new UserModel({
            name: 'Patient Test',
            email: 'patient@krita.com',
            password: secPassword,
            role: 'patient',
            user_verify: 1,
            gender: 'Male',
            dob: '1990-10-20',
            phone: '9999999999',
            adhar_no: '9876 5432 1098',
            father_name: 'Bob Test',
            mother_name: 'Alice Test',
            marital_status: 'Married'
        }).save();

        console.log("Database seeded with Admin, Doctor, and Patient users successfully.");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
seed();
