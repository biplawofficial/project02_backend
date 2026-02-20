require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserModel = require('./models/users');
const BookingModel = require('./models/booking');
const DoctorAvailabilityModel = require('./models/doctorAvalability');
const InventoryModel = require('./models/inventory');
const LatestNewsModel = require('./models/latestNew');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // 1. Clear existing database collections
        const collections = await mongoose.connection.db.collections();
        for (let collection of collections) {
            await collection.deleteMany({});
        }
        console.log("Database cleared successfully.");

        const salt = await bcrypt.genSalt(10);
        const secPassword = await bcrypt.hash('123456', salt);

        // 2. Seed Users
        // Admin
        const admin = await new UserModel({
            name: 'Priya Admin',
            email: 'admin@krita.com',
            password: secPassword,
            role: 'admin',
            user_verify: 1,
            phone: '8888888880',
            gender: 'female',
            dob: '1980-01-01'
        }).save();

        // Doctors
        const doctorApproved = await new UserModel({
            name: 'Dr. Rohan Kumar',
            email: 'rohan.doctor@krita.com',
            password: secPassword,
            role: 'doctor',
            user_verify: 1,
            approval: 2, // Approved
            gender: 'male',
            dob: '1975-06-15',
            phone: '9876543210',
            adhar_no: '123456789012',
            father_name: 'Mr. Kumar Sr.',
            mother_name: 'Mrs. Kumar',
            maritial_status: 'married',
            qualification: 'MBBS, MD',
            specialization: 'Cardiology',
            work_experience: '15',
            fee_per_consultation: 500,
            profile_image: 'uploads/default-doctor.jpg' // Assuming a default image might be needed or handled gracefully
        }).save();

        const doctorPending = await new UserModel({
            name: 'Dr. Sneha Patel',
            email: 'sneha.doctor@krita.com',
            password: secPassword,
            role: 'doctor',
            user_verify: 1,
            approval: 1, // Pending Approval
            gender: 'female',
            dob: '1988-11-20',
            phone: '8765432109',
            adhar_no: '987654321012',
            father_name: 'Mr. Patel',
            mother_name: 'Mrs. Patel',
            maritial_status: 'single',
            qualification: 'BDS',
            specialization: 'Dentistry',
            work_experience: '5',
            fee_per_consultation: 300
        }).save();

        // Patients
        const patient1 = await new UserModel({
            name: 'Amit Sharma',
            email: 'amit.patient@krita.com',
            password: secPassword,
            role: 'patient',
            user_verify: 1,
            gender: 'male',
            dob: '1995-03-10',
            phone: '7654321098',
            adhar_no: '543210987654',
            father_name: 'Mr. Sharma',
            mother_name: 'Mrs. Sharma',
            maritial_status: 'single'
        }).save();

        const patient2 = await new UserModel({
            name: 'Neha Gupta',
            email: 'neha.patient@krita.com',
            password: secPassword,
            role: 'patient',
            user_verify: 1,
            gender: 'female',
            dob: '1992-08-25',
            phone: '6543210987',
            adhar_no: '432109876543',
            father_name: 'Mr. Gupta',
            mother_name: 'Mrs. Gupta',
            maritial_status: 'married'
        }).save();

        console.log("Users seeded.");

        // 3. Seed Doctor Availability
        await new DoctorAvailabilityModel({
            doctor_id: doctorApproved._id.toString(),
            time_slot: 30,
            morning: { from: '09:00', to: '12:00' },
            afternoon: { from: '13:00', to: '16:00' },
            evening: { from: '17:00', to: '19:00' }
        }).save();

        console.log("Doctor availability seeded.");

        // 4. Seed Bookings
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        await new BookingModel({
            doctor_id: doctorApproved._id,
            patient_id: patient1._id,
            bookingDate: today,
            bookingTime: '09:30 AM',
            prescription: [
                { name: 'Paracetamol', qunatity: 10, morning: '1', afternoon: '0', evening: '1' }
            ]
        }).save();

        await new BookingModel({
            doctor_id: doctorApproved._id,
            patient_id: patient2._id,
            bookingDate: tomorrow,
            bookingTime: '14:00 PM',
            prescription: [
                { name: 'Amoxicillin', qunatity: 15, morning: '1', afternoon: '1', evening: '1' },
                { name: 'Ibuprofen', qunatity: 5, morning: '1', afternoon: '0', evening: '0' }
            ]
        }).save();

        console.log("Bookings seeded.");

        // 5. Seed Inventory
        await new InventoryModel({
            medicine_name: 'Paracetamol 500mg',
            available_quantity: 500
        }).save();

        await new InventoryModel({
            medicine_name: 'Amoxicillin 250mg',
            available_quantity: 200
        }).save();

        await new InventoryModel({
            medicine_name: 'Cough Syrup',
            available_quantity: 50
        }).save();

        console.log("Inventory seeded.");

        // 6. Seed Latest News
        await new LatestNewsModel({
            date: new Date().toISOString().split('T')[0],
            news: 'Hospital Management System updated with new features! Doctors can now easily manage their availability.'
        }).save();

        await new LatestNewsModel({
            date: '2023-10-26',
            news: 'Free health checkup camp organizing next Sunday. Please register at the reception.'
        }).save();

        console.log("Latest news seeded.");

        console.log("Full Database Seed completed successfully.");
    } catch (err) {
        console.error("Error during database seeding:", err);
    } finally {
        process.exit(0);
    }
}

seed();
