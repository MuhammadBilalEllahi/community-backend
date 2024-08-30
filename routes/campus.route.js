const express = require("express")
const Campus = require("../models/campus/campus.model")
const router = express.Router()


router.get("/locations", async (req, res) => {
    try {
        const locations = await Campus.find().select('location')
        // console.log(locations)
        if (!locations) return res.status(404).json({ error: "No Locations Found" })
        res.status(200).json({ locations: locations })
    } catch (error) {
        console.log("Error in campus get locations ", error.message)
        res.status(500).json("Internal Server Error")
    }
})

module.exports = router