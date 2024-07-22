const express = require("express")
const { signupR, updateInfoR, login, logout } = require("../controllers/auth.controller")

const router = express.Router()


router.post("/signup", signupR)
router.post("/login", login)
router.post("/logout", logout)


router.put("/registered/update-info", updateInfoR)






module.exports = router;