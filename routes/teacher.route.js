const express = require("express")
const { allTeachers } = require("../controllers/teacher.controller")
const router = express.Router()




router.get("/", allTeachers)




module.exports = router