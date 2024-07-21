const express = require("express")
const router = express.Router()

const { loginWithGoogle } = require("../controllers/request.controller");



router.post("/", loginWithGoogle)


module.exports = router