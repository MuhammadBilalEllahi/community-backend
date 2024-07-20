const express = require("express")
const router = express.Router()

router.post("/login", async (req, res) => {
    const { username,
        password } = req.body
    try {

        res.status(200).json({
            value: "hjhjhj"
        })
    } catch (error) {
        res.send({ message: "data not found" })
    }
})


module.exports = router;