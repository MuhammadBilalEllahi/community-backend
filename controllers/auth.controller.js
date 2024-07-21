const User = require("../models/user.model.js");
const bcryptjs = require("bcryptjs");
const generateToken = require('../utils/generate.token.js');
const { OAuth2Client } = require('google-auth-library');



const signupR = async (req, res) => {
    try {
        const { universityEmail, universityEmailPassword } = req.body;

        // if (password !== confirmPassword) return res.status(400).json({ error: "password do not match" })
        const user = await User.findOne({ universityEmail })


        if (user) return res.status(400).json({ error: "User already Exists" })


        const saltRound = await bcryptjs.genSalt(10)
        const hashedPassowrd = await bcryptjs.hash(universityEmailPassword, saltRound)

        const userCreate = new User({
            universityEmail: universityEmail,
            password: hashedPassowrd
        })

        if (userCreate) {
            generateTokenAndSetCookie(userCreate._id, res)
            await userCreate.save()

            res.status(200).json({
                redirectUrl: `http://localhost:3000/auth/registered/update-info?id=${userCreate._id}`
            })

            // res.status(201).json({
            //     _id: userCreate._id,
            //     fullName: userCreate.fullName,
            //     username: userCreate.username,
            //     profilePic: userCreate.profilePic

            // })
        }
        else {
            res.status(400).json({ error: "Invalid User Data" })
        }

    } catch (error) {
        console.log("Error in- signup-registered-student-controller: ", error.message)
        res.status(500).json({ error: "Internal Server Error" })
        // throw new Error("Error in- signup-controller: ", error)
    }


}


const updateInfoR = async (req, res) => {

    const { username, personalEmail, phoneNumber, urls } = req.body;
    const { id } = req.query;
    console.log("ID: ", id, "and", username, personalEmail, phoneNumber, urls)
    try {

        // const findUser = await User.findOne(id)

        // if (!findUser) return res.status(404).json({ message: "No User Found" })

        const jwtToken = generateToken(id)
        const response = await User.findOneAndUpdate({ _id: id }, {
            username, personalEmail: personalEmail, phoneNumber, token: jwtToken
        })

        console.log(response)
        res.status(200).json({
            token: jwtToken
        })

    } catch (error) {

        console.log("Error in- signup-registered-student-updateInfo-controller: ", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
}






















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

// const signup = async (req, res) => {
//     try {
//         const { fullName, username, password, confirmPassword, gender } = req.body;

//         if (password !== confirmPassword) return res.status(400).json({ error: "password do not match" })
//         const user = await User.findOne({ username })


//         if (user) return res.status(400).json({ error: "User already Exists" })


//         const boyPic = `https://avatar.iran.liara.run/public/boy?username=${username}`
//         const girlPic = `https://avatar.iran.liara.run/public/girl?username=${username}`

//         const saltRound = await bcryptjs.genSalt(10)
//         const hashedPassowrd = await bcryptjs.hash(password, saltRound)

//         const userCreate = new User({
//             fullName,
//             username,
//             password: hashedPassowrd,
//             gender,
//             profilePic: gender.toString() === 'male' ? boyPic : girlPic
//         })

//         if (userCreate) {
//             generateTokenAndSetCookie(userCreate._id, res)
//             await userCreate.save()

//             res.status(201).json({
//                 _id: userCreate._id,
//                 fullName: userCreate.fullName,
//                 username: userCreate.username,
//                 profilePic: userCreate.profilePic

//             })
//         }
//         else {
//             res.status(400).json({ error: "Invalid User Data" })
//         }






//     } catch (error) {
//         console.log("Error in- signup-controller: ", error.message)
//         res.status(500).json({ error: "Internal Server Error" })
//         // throw new Error("Error in- signup-controller: ", error)
//     }


// }


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







module.exports = {
    signupR, updateInfoR,
    login, logout
}