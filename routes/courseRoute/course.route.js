const express = require('express');
const { addCourse, addCourses } = require('../../controllers/coursesController/course.controller');
const router = express.Router()


router.post('/add-course', addCourse);
router.post('/add-courses', addCourses);

module.exports = router;


