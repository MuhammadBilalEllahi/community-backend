// const jwt = require("jsonwebtoken");
const User = require("../models/user.model.js");


const protectRoute = async (req, res, next) => { ///req res order is must
    try {
        if (req.session.user) {

            const _id = req.session.user._id
            const user = await User.findOne({ _id }).select("-password")
            if (!user) return res.status(404).json({ error: "User has no privilidges" })
            next()
        } else {
            res.status(401).json({ error: "Not authenticated" });

        }


    } catch (error) {
        console.log("Error in- protect Route-middleware: ", error.message)
        res.status(500).json({ error: "Internal Server Error" })

    }
}
module.exports = protectRoute;



// const session = async (req, res) => {

//     console.log("Req user:", req.session.user)
//     if (req.session.user) {
//         res.status(200).json({
//             _id: req.session.user._id,
//             name: req.session.user.name,
//             email: req.session.user.email,
//             picture: req.session.user.picture,
//             username: req.session.user.username,
//             token: req.session.user.token
//         });


//     } else {
//         res.status(401).json({ error: "Not authenticated" });
//     }

// }