const express = require("express")
const { signupR, updateInfoR, login, logout, session } = require("../controllers/auth.controller")

const router = express.Router()


router.post("/signup", signupR)
router.post("/login", login)
router.post("/logout", logout)
router.get('/session', session)

router.put("/registered/update-info", updateInfoR)






module.exports = router;