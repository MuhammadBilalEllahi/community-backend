const express = require('express');
const { getSubjects, addSubject, addSubjects } = require('../../controllers/coursesController/subject.controller');
const router = express.Router()

router.get("/", getSubjects)
router.post("/", addSubject)
router.post("/subjects", addSubjects)



module.exports = router;