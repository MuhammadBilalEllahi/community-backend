const { default: mongoose } = require("mongoose");

const subjectSchema = new mongoose.Schema({
    name: { type: String },
    courseCode: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    years: [{ type: mongoose.Schema.Types.ObjectId, ref: "Year" }],
});



// subjectSchema.virtual('name').get(function () {
//     return this.courseCode && this.courseCode.courseName;
// });
// or we can do maybe like
// subjectSchema.pre('save', async function(next) {
//     const course = await Course.findById(this.courseCode);
//     if (course) {
//         this.name = course.courseName;
//         next();
//     } else {
//         next(new Error('Course not found'));
//     }
// });

const Subject = mongoose.model("Subject", subjectSchema);

module.exports = { Subject }