const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    courseCode: { type: String, required: true, unique: true },
    courseName: { type: String, required: true },
    creditHours: { type: String, required: true },
    preRequisites: { type: [String], default: '-' }
});

const Course = mongoose.model('Course', courseSchema);

module.exports = { Course };
