const { Department } = require("../../models/courseModels/department.model");
const { Subject } = require("../../models/courseModels/subject.model");


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
            console.log("name", name)

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

const getDepartments = async (req, res) => {

    try {
        const departments = await Department.find()
        if (!departments) return res.status(300).json({ message: "Error fetching Department" })

        res.status(200).json({ departments })

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
            const subject = await Subject.findOne({ courseCode: courseCode });
            if (!subject) return res.status(404).json({ error: "No CourseCode Found" })

            subjectIds.push(subject._id);
            console.log(`Subject ${subject.name} and courseCode ${courseCode} added to department ${department.name}`)
        }

        department.subjects.push(...subjectIds);
        await department.save();

        res.status(200).json({ message: `Subject ${subject.name} and courseCode ${courseCode} added to department ${department.name}` })

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    addDepartment,
    getDepartments,
    addSubjectToDepartment,
    addSubjectsToDepartment,
    addDepartments
}