const express = require("express")
const {
    allTeachers, rateATeacher, teacherSpeficicInfo, getTeacherReviews,
    get_a_TeacherReviews, updateReviewVote, deleteReview, getTeacherByCampusLocation
} = require("../controllers/teacher.controller")
const router = express.Router()




router.get("/", allTeachers)
router.get("/teacher/info", teacherSpeficicInfo)
router.get('/teacher/reviews', getTeacherReviews)
router.get('/teacher/reviews/comments', get_a_TeacherReviews)

router.post("/teachers-by-location", getTeacherByCampusLocation)
router.post('/teacher/rate-teacher', rateATeacher)
router.post('/teacher/reviews/comments/vote', updateReviewVote)


router.delete('/teacher/reviews/comments/delete', deleteReview)

module.exports = router