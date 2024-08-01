const express = require('express');
const { addDepartment, addDepartments,
    getDepartments, getDepartmentsWithSubjects,
    addSubjectToDepartment, addSubjectsToDepartment } = require('../../controllers/coursesController/department.controller');
const router = express.Router()


router.get("/", getDepartments)
router.get("/and-subjects", getDepartmentsWithSubjects)

router.post("/", addDepartment)
router.post("/departments", addDepartments)
router.post("/add-subject", addSubjectToDepartment)
router.post("/add-subjects", addSubjectsToDepartment)



module.exports = router;