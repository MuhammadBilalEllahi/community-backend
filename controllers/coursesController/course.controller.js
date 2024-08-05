const Course = require("../../models/courseModels/course.model");

const addCourse = async (req, res) => {
    const { courseCode, courseName, creditHours, preRequisites } = req.body;

    try {
        const newCourse = new Course({
            courseCode,
            courseName,
            creditHours,
            preRequisites: preRequisites || '-'
        });

        await newCourse.save();
        res.status(201).json(newCourse);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

const addCourses = async (req, res) => {
    const courses = req.body;

    try {
        let i = 1
        for (let course of courses) {
            // console.log("Processing Course ", i++, course)
            const { courseCode, courseName, creditHours, preRequisites } = course


            const newCourse = new Course({
                courseCode,
                courseName,
                creditHours,
                preRequisites: preRequisites || '-'
            });
            await newCourse.save();
            // console.log("Added Course ", i++, course)

        }



        res.status(201).json(newCourse);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}
module.exports = {
    addCourse,
    addCourses
}