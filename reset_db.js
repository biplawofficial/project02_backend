require('dotenv').config();
const mongoose = require('mongoose');

async function resetDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const collections = await mongoose.connection.db.collections();
        for (let collection of collections) {
            await collection.deleteMany({});
        }
        console.log("Database reset successfully.");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
resetDB();
