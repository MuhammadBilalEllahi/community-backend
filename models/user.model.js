const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    personalEmail: {
        type: String,
        required: true,
        unique: true
    },
    universityEmail: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    gender: {
        type: String,
        enum: ["male", "female"]
    },
    profilePic: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
})

const User = mongoose.model("User", userSchema)
module.exports = User;