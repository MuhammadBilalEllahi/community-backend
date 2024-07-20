const mongoose = require('mongoose');

const connectToMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_DB_URI)
        console.log("Connected To Mongo Database");
    } catch (error) {
        console.error("Mongo Database Error Catch Messgae: ", error.message)
        // throw new Error(error)
    }
}

module.exports = connectToMongoDB

