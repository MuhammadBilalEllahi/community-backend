const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const teacherSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    designation: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    areaOfInterest: {
        type: String,
        required: true
    },
    supervisorStatus: {
        type: String,
        // required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    profileUrl: {
        type: String,
        required: true
    },
    onLeave: {
        type: Boolean,
        required: true
    },
    rating: {
        type: Number,
        default: 0
    },
    ratings: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        hideUser: { type: Boolean, default: false },
        rating: { type: Number, required: true },
        comment: { type: String }
    }]
});


const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher;


// const mongoose = require("mongoose");

// const teacherSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true,
//         default: ''
//     },
//     area_of_interest: {
//         type: String,
//         default: ''
//     },
//     image: {
//         type: String,
//         default: ''
//     },
//     profession: {
//         type: String,
//         default: ''
//     },
//     hec_approved: {
//         type: String,
//         default: false
//     },
//     rating: {
//         type: Number,
//         default: 0
//     },
//     onleave: {
//         type: Boolean,
//         default: false

//     }
// })

// const Teacher = mongoose.model("Teacher", teacherSchema);

// module.exports = Teacher;
