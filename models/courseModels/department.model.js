// it is beetter to use this approach for large data set, the one without ref is sure simple but query heavy.
// this one requires more req to db but less load and time for frontend. mainly user experience.
// llike we can use reddis to get static one time daata and dont exec too many load to db
const mongoose = require("mongoose");
const { Semester } = require("./semester.model");

const departmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
    studyPlan: [{ type: mongoose.Schema.Types.ObjectId, ref: "Semester" }],
    totalCourses: { type: Number },
    creditHours: { type: Number },
});

// departmentSchema.pre('save', async function (next) {
//     const department = this;

//     if (department.studyPlan && department.studyPlan.length > 0) {
//         const semesters = await Semester.find({ _id: { $in: department.studyPlan } }).exec();

//         let totalCourses = 0;
//         semesters.forEach(semester => {
//             totalCourses += semester.courses.core.length + semester.courses.elective.length;
//         });

//         department.totalCourses = totalCourses;
//     }

//     next();
// });
const Department = mongoose.model("Department", departmentSchema);

module.exports = { Department };


