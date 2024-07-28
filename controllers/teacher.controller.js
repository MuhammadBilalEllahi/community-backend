const Teacher = require("../models/teacher.model")


const allTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.find()
        // console.log(teachers)
        res.status(200).json({ "teachers": teachers })
    } catch (error) {
        res.status(500).json({ "error": error })
        // throw new Error(error)
    }
}
module.exports = {
    allTeachers
}