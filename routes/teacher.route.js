const express = require("express")
const { allTeachers, rateATeacher, getTeacherReviews } = require("../controllers/teacher.controller")
const router = express.Router()




router.get("/", allTeachers)
router.get('/teacher/reviews', getTeacherReviews)

router.post('/teacher/rate-teacher', rateATeacher)

module.exports = router