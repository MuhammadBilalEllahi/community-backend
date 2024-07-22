const express = require('express')
const { resendEmail } = require('../controllers/email.controller.js')
const router = express.Router()

router.post("/mail/resend", resendEmail)


module.exports = router