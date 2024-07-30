const express = require("express")
const { allTeachers, rateATeacher, teacherSpeficicInfo, getTeacherReviews, get_a_TeacherReviews } = require("../controllers/teacher.controller")
const router = express.Router()




router.get("/", allTeachers)
router.get("/teacher/info", teacherSpeficicInfo)
router.get('/teacher/reviews', getTeacherReviews)
router.get('/teacher/reviews/comments', get_a_TeacherReviews)

router.post('/teacher/rate-teacher', rateATeacher)

module.exports = router