const { default: mongoose } = require("mongoose");

const semesterSchema = new mongoose.Schema({
    semesterNumber: { type: Number, required: true },
    courses: {
        core: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
        elective: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }]
    }
});

const Semester = mongoose.model("Semester", semesterSchema);

module.exports = { Semester }