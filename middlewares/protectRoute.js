const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");


const protectRoute = async (req, res, next) => { ///req res order is must
    try {
        const token = req.cookies.jwt;

        if (!token) return res.status(401).json({ error: "Un Authorized - No Token" })

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) return res.status(401).json({ error: "Un Authorized - InValid Token" })

        const _id = decoded.userId
        const user = await User.findOne({ _id }).select("-password")

        if (!user) return res.status(404).json({ error: "User Not Found" })

        req.user = user;

        next()

    } catch (error) {
        console.log("Error in- protect Route-middleware: ", error.message)
        res.status(500).json({ error: "Internal Server Error" })

    }
}
module.exports = protectRoute;