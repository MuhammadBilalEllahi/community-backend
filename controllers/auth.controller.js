const User = require("../models/user.model.js");
const bcryptjs = require("bcryptjs");
const generateToken = require('../utils/generate.token.js');
const { OAuth2Client } = require('google-auth-library');
const { resendEmail } = require("./email.controller.js");
const jwt = require("jsonwebtoken");


const signupR = async (req, res) => {
    try {
        const { universityEmail, universityEmailPassword } = req.body;

        // if (password !== confirmPassword) return res.status(400).json({ error: "password do not match" })
        const user = await User.findOne({ universityEmail })


        if (user) return res.status(400).json({ error: "User already Exists" })
        // fa21-bcs-058

        const saltRound = await bcryptjs.genSalt(10)
        const hashedPassowrd = await bcryptjs.hash(universityEmailPassword, saltRound)

        const userCreate = new User({
            universityEmail: universityEmail,
            password: hashedPassowrd
        })

        if (userCreate) {
            const token = await generateToken(userCreate._id)
            await userCreate.save()

            const datas = {
                name: "",
                email: universityEmail,
                subject: "Account Activation - Test",
                message: "Please Activate your account within 7 day, otherwise your record will be deleted. To ensure security, this policy is implemented",
                html: `
                <h2> Please Follow this Link to Activate Account</p><br/> 
                <a href="http://localhost:3000/auth/registered/update-info?id=${token}" >www.localhost.com</a>
                `
            }

            await resendEmail(datas, req, res)

            res.status(200).json({ message: "Account will be deleted if not activated within a week" })

            // res.status(200).json({
            //     redirectUrl: `http://localhost:3000/auth/registered/update-info?id=${userCreate._id}`
            // })

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
        // console.log("Error in- signup-registered-student-controller: ", error.message)
        res.status(500).json({ error: "Internal Server Error" })
        // throw new Error("Error in- signup-controller: ", error)
    }


}


const updateInfoR = async (req, res) => {

    const { username, personalEmail, phoneNumber, urls } = req.body;
    const { id } = req.query;
    // console.log("\nID: ", id, "\nand", username, personalEmail, phoneNumber, urls, "\n")
    try {

        const decodedJwt = jwt.decode(id, process.env.JWT_SECRET)
        // console.log("\nDecoded:", decodedJwt, "\n")

        const _id = decodedJwt.userId
        const findUser = await User.findOne({ _id: _id })
        if (!findUser) return res.status(404).json({ message: "No User Found" })


        // if(findUser.universityEmailVerified) return 



        const jwtToken = generateToken(findUser._id)
        const response = await User.findOneAndUpdate({ _id: findUser._id }, {
            username, personalEmail: personalEmail, phoneNumber, token: jwtToken, universityEmailVerified: true
        })
        const datas = {
            name: "",
            email: findUser.universityEmail,
            subject: "Account Activated - Test",
            message: "Thanks For Securing Your Account",
            html: `
            <h2> Now You Can Login to Your Account</p><br/> 
            <a href="http://localhost:3000/login" >www.localhost.com</a>
            `
        }

        await resendEmail(datas, req, res)


        // console.log(response)

        res.status(200).json({ message: "Success", token: jwtToken })

    } catch (error) {
        console.log("Error in- signup-registered-student-updateInfo-controller: ", error.message)
        res.status(500).json({ error: "Internal Server Error" })
    }
}




const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // console.log(email, password)
        const user = await User.findOne({ universityEmail: email });

        // console.log(user)
        // console.log(user?.password)

        const isPassMatched = await bcryptjs.compare(password, user?.password || '')
        console.log(isPassMatched)
        if (!user || !isPassMatched) return res.status(400).json({ error: "Invalid email or password" })

        const token = generateToken(user._id, res)
        const newTokenToUser = await User.findByIdAndUpdate({ _id: user._id }, {
            token: token
        })

        req.user = newTokenToUser;

        res.status(201).json({ token: token })


    } catch (error) {
        // console.log("Error in- login-controller: ", error.message)
        res.status(500).json({ error: "Internal Server Error" })
        // throw new Error("Error in- login-controller: ", error)
    }


}

















const logout = async (req, res) => {
    const { token } = req.body
    try {
        // res.cookie("jwt", "", { maxAge: 0 })
        console.log(req.user)
        const user = jwt.decode(token, process.env.JWT_SECRET)
        console.log(user.userId)
        const newTokenToUser = await User.findByIdAndUpdate({ _id: user.userId }, {
            token: ''
        })

        console.log(newTokenToUser);
        req.user = undefined;
        res.status(200).json({ message: "Logged Out" })
        // console.log("b", req.user)
        // console.log("ba", req.user)
    } catch (error) {
        // console.log("Error in- logout-controller: ", error.message)
        res.status(500).json({ error: "Internal Server Error" })
        // throw new Error("Error in- logout-controller: ", error)
    }
}







module.exports = {
    signupR, updateInfoR,
    login, logout
}