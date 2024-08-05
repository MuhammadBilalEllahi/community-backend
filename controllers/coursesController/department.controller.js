// const client = require("../../db/redisClient");
const { Course } = require("../../models/courseModels/course.model");
const { Department } = require("../../models/courseModels/department.model");
const { Subject } = require("../../models/courseModels/subject.model");


const getDepartments = async (req, res) => {

    try {
        const departments = await Department.find()
        if (!departments) return res.status(300).json({ message: "Error fetching Department" })

        res.status(200).json({ departments })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }

}


const getDepartmentsWithSubjects = async (req, res) => {
    // const cacheKey = 'departments_with_subjects';

    try {
        // const cachedDepartment = await client.get(cacheKey)
        // if (cachedDepartment) {

        //     console.log('Data retrieved from cache');
        //     return res.status(200).json(JSON.parse(cachedDepartment))
        // }
        const departments = await Department.find().select("name subjects").populate({ path: 'subjects name', select: "name courseCode department" })
        if (!departments) return res.status(300).json({ message: "Error fetching Department" })

        // const subjects = await

        // console.log(departments)

        // await client.set(cacheKey, JSON.stringify({ departments }), 'EX', 2 * 3600)
        res.status(200).json({ departments })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }

}

const addDepartment = async (req, res) => {
    const { name } = req.body;
    try {
        const department = await Department.findOne({ name: name })
        if (department) return res.status(300).json({ message: "Department already exists" })

        const departmentCreated = await Department.create({
            name: name
        })
        res.status(200).json({ message: departmentCreated })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }

}
const addDepartments = async (req, res) => {
    const data = req.body;
    try {
        for (let names of data) {
            const { name } = names
            // console.log("name", name)

            const department = await Department.findOne({ name: name })
            if (department) return res.status(300).json({ message: "Department already exists" })

            const departmentCreated = await Department.create({
                name: name
            })
            console.log("Depratment Created", departmentCreated)
        }

        res.status(200).json({ message: departmentCreated })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }

}
const addSubjectToDepartment = async (req, res) => {
    const { departmentId, courseCode } = req.body; //pass id is better put id on frontend when getting departments
    try {

        const department = await Department.findById(departmentId);
        if (!department) return res.status(404).json({ error: 'department id incorrect' })

        const subject = await Subject.findone({ courseCode: courseCode });
        if (!subject) return res.status(404).json({ error: "No CourseCode Found" })

        department.subjects.push(subject._id);
        await department.save();

        res.status(200).json({ message: `Subject ${subject.name} and courseCode ${courseCode} added to department ${department.name}` })

        console.log(`Subject ${subject.name} and courseCode  ${courseCode} added to department ${department.name}`);
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}
const addSubjectsToDepartment = async (req, res) => {
    const { departmentId, courseCode } = req.body; // subjectName is expected to be an array of names

    try {
        const department = await Department.findById(departmentId);
        if (!department) return res.status(404).json({ error: 'department id incorrect' });

        const subjectIds = [];

        for (let code of courseCode) {
            const courseCodeID = await Course.findOne({ courseCode: code })
            if (!courseCodeID) return res.status(404).json({ error: "No CourseCode Found" })
            const subject = await Subject.findOne({ courseCode: courseCodeID });
            if (!subject) return res.status(404).json({ error: "No Subject Found" })

            subjectIds.push(subject._id);
            console.log(`Subject ${subject.name} and courseCode ${code} is ${courseCodeID}\n added to department ${department.name}`)
        }

        department.subjects.push(...subjectIds);
        await department.save();

        res.status(200).json({ message: `Subject ${subject.name} and courseCode ${code} added to department ${department.name}` })

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    addDepartment,
    getDepartments,
    addSubjectToDepartment,
    addSubjectsToDepartment,
    addDepartments,
    getDepartmentsWithSubjects
}