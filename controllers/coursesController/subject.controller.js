const { Course } = require("../../models/courseModels/course.model")
const { Department } = require("../../models/courseModels/department.model")
const { Subject } = require("../../models/courseModels/subject.model")

const getSubjects = async (req, res) => {

    try {
        const subjects = await Subject.find()
        if (!subjects) return res.status(300).json({ message: "No Subjects Found" })


        res.status(200).json({ subjects })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }

}


const addSubject = async (req, res) => {
    const { courseCode, department } = req.body

    try {

        const departmentFetch = await Department.findOne({ name: department })
        if (!departmentFetch) return res.status(404).json({ error: "No Department found with such name" })

        const course = await Course.findOne({ courseCode: courseCode })
        if (!course) return res.status(404).json({ error: "No Course found with such code" })

        const subjectCreated = await Subject.create({
            name: course.courseName,
            courseCode: course._id,
            department: departmentFetch._id
        })

        res.status(200).json({ subjectCreated })


    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}


const addSubjects = async (req, res) => {
    const data = req.body;
    try {


        for (let record of data) {
            const { department, courseCode } = record;
            const departmentFetch = await Department.findOne({ name: department })
            if (!departmentFetch) return res.status(404).json({ error: "No Department found with such name" })

            const course = await Course.findOne({ courseCode })
            if (!course) return res.status(404).json({ error: "No Course found with such code" })

            const subjectCreated = await Subject.create({
                name: course.courseName,
                courseCode: course._id,
                department: departmentFetch._id
            })

            console.log("Subject Created", subjectCreated)
        }
        res.status(200).json({ subjectCreated })


    } catch (error) {

    }
}

module.exports = {
    getSubjects,
    addSubject,
    addSubjects
}































