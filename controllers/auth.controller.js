const User = require("../models/user.model.js");
const bcryptjs = require("bcryptjs");
const generateTokenAndSetCookie = require('../utils/generate.token.js');
const { OAuth2Client } = require('google-auth-library');


const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });

        const isPassMatched = bcryptjs.compare(password, user?.password || '')

        if (!user || !isPassMatched) return res.status(400).json({ error: "Invalid username or password" })

        generateTokenAndSetCookie(user._id, res)

        res.status(201).json({
            _id: user._id,
            fullName: user.fullName,
            username: user.username,
            profilePic: user.profilePic

        })


    } catch (error) {
        console.log("Error in- login-controller: ", error.message)
        res.status(500).json({ error: "Internal Server Error" })
        // throw new Error("Error in- login-controller: ", error)
    }


}

const signup = async (req, res) => {
    try {
        const { fullName, username, password, confirmPassword, gender } = req.body;

        if (password !== confirmPassword) return res.status(400).json({ error: "password do not match" })
        const user = await User.findOne({ username })


        if (user) return res.status(400).json({ error: "User already Exists" })


        const boyPic = `https://avatar.iran.liara.run/public/boy?username=${username}`
        const girlPic = `https://avatar.iran.liara.run/public/girl?username=${username}`

        const saltRound = await bcryptjs.genSalt(10)
        const hashedPassowrd = await bcryptjs.hash(password, saltRound)

        const userCreate = new User({
            fullName,
            username,
            password: hashedPassowrd,
            gender,
            profilePic: gender.toString() === 'male' ? boyPic : girlPic
        })

        if (userCreate) {
            generateTokenAndSetCookie(userCreate._id, res)
            await userCreate.save()

            res.status(201).json({
                _id: userCreate._id,
                fullName: userCreate.fullName,
                username: userCreate.username,
                profilePic: userCreate.profilePic

            })
        }
        else {
            res.status(400).json({ error: "Invalid User Data" })
        }






    } catch (error) {
        console.log("Error in- signup-controller: ", error.message)
        res.status(500).json({ error: "Internal Server Error" })
        // throw new Error("Error in- signup-controller: ", error)
    }


}


const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 })
        res.status(200).json({ message: "Logged Out" })
        console.log("b", req.user)
        req.user = undefined;

        console.log("ba", req.user)
    } catch (error) {
        console.log("Error in- logout-controller: ", error.message)
        res.status(500).json({ error: "Internal Server Error" })
        // throw new Error("Error in- logout-controller: ", error)
    }
}







module.exports = { login, logout, signup }