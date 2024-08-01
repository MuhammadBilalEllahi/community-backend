const express = require('express');
const { getSubjects, addSubject, addSubjects, addYearlyRecordFallAndSpring } = require('../../controllers/coursesController/subject.controller');
const router = express.Router()

router.get("/", getSubjects)
router.post("/", addSubject)
router.post("/subjects", addSubjects)

router.post("/year-fall-spring", addYearlyRecordFallAndSpring)




module.exports = router;