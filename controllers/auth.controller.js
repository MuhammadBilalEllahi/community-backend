const User = require("../models/user.model.js");
const bcryptjs = require("bcryptjs");
const generateToken = require("../utils/generate.token.js");
const { OAuth2Client } = require("google-auth-library");
const { resendEmail } = require("./email.controller.js");
const jwt = require("jsonwebtoken");

const signupR = async (req, res) => {
    console.log(req.body);
    try {
        const { universityEmail, universityEmailPassword } = req.body;

        // if (password !== confirmPassword) return res.status(400).json({ error: "password do not match" })
        const user = await User.findOne({ universityEmail });

        if (user) return res.status(400).json({ error: "User already Exists" });
        // fa21-bcs-058

        const saltRound = await bcryptjs.genSalt(10);
        const hashedPassowrd = await bcryptjs.hash(
            universityEmailPassword,
            saltRound
        );

        const username = universityEmail.split("@")[0];
        // console.log("here");
        const userCreate = new User({
            universityEmail: universityEmail,
            password: hashedPassowrd,
            username: username,
        });

        if (userCreate) {
            const token = await generateToken(
                {
                    _id: userCreate._id,
                    name: userCreate.name,
                    picture: userCreate.profilePic,
                    email: userCreate.universityEmail,
                    email_verified: userCreate.universityEmailVerified
                },
                res
            );
            await userCreate.save();
            console.log("her2e");
            const datas = {
                name: "",
                email: universityEmail,
                subject: "Account Activation - Test",
                message:
                    "Please Activate your account within 7 day, otherwise your record will be deleted. To ensure security, this policy is implemented",
                html: `
                <h2> Please Follow this Link to Activate Account</p><br/> 
                <a href="http://localhost:3000/auth/registered/update-info?id=${token}" >www.localhost.com</a>
                `,
            };

            await resendEmail(datas, req, res);

            res
                .status(200)
                .json({
                    message: "Account will be deleted if not activated within a week",
                });

            // res.status(200).json({
            //     redirectUrl: `http://localhost:3000/auth/registered/update-info?id=${userCreate._id}`
            // })

            // res.status(201).json({
            //     _id: userCreate._id,
            //     fullName: userCreate.fullName,
            //     username: userCreate.username,
            //     profilePic: userCreate.profilePic

            // })
        } else {
            res.status(400).json({ error: "Invalid User Data" });
        }
    } catch (error) {
        console.log(
            "Error in- signup-registered-student-controller: ",
            error.message
        );
        res.status(500).json({ error: "Internal Server Error" });
        // throw new Error("Error in- signup-controller: ", error)
    }
};

const updateInfoR = async (req, res) => {
    const { username, personalEmail, phoneNumber, urls } = req.body;
    const { id } = req.query;
    // console.log("\nID: ", id, "\nand", username, personalEmail, phoneNumber, urls, "\n")
    try {
        const decodedJwt = jwt.decode(id, process.env.JWT_SECRET);
        console.log("\nDecoded:", decodedJwt, "\n")

        const _id = decodedJwt._d;
        const findUser = await User.findOne({ _id: _id });
        if (!findUser) return res.status(404).json({ message: "No User Found" });

        // if(findUser.universityEmailVerified) return

        const jwtToken = generateToken(findUser._id);
        const response = await User.findOneAndUpdate(
            { _id: findUser._id },
            {
                username,
                personalEmail: personalEmail,
                phoneNumber,
                token: jwtToken,
                universityEmailVerified: true,
            }
        );
        const datas = {
            name: "",
            email: findUser.universityEmail,
            subject: "Account Activated - Test",
            message: "Thanks For Securing Your Account",
            html: `
            <h2> Now You Can Login to Your Account</p><br/> 
            <a href="http://localhost:3000/login" >www.localhost.com</a>
            `,
        };

        await resendEmail(datas, req, res);

        // console.log(response)

        res.status(200).json({ message: "Success", token: jwtToken });
    } catch (error) {
        console.log(
            "Error in- signup-registered-student-updateInfo-controller: ",
            error.message
        );
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // console.log(email, password)

        const userUniversity = await User.findOne({ universityEmail: email });
        const userPersonal = await User.findOne({ personalEmail: email });
        let user;
        let is_user_uni;

        if (Boolean(userUniversity)) {
            is_user_uni = true;
            user = userUniversity;
        } else if (Boolean(userPersonal)) {
            is_user_uni = false;
            user = userPersonal;
        } else {
            is_user_uni = null;
            user = null;
        }
        // console.log(user)
        // console.log(user?.password)



        const isPassMatched = await bcryptjs.compare(
            password,
            user?.password || ""
        );
        // console.log(isPassMatched)
        if (!user || !isPassMatched)
            return res.status(400).json({ error: "Invalid email or password" });

        if (!user.google_EmailVerified) {
            if (is_user_uni) {
                if (!user.universityEmailVerified) {
                    console.log("universityEmailVerified Not")
                    return res.status(400).json({ error: "User Not Verified, Check your mail" })
                }
            } else if (!is_user_uni) {
                if (!user.universityEmailVerified) {
                    console.log("personalEmailVerified Not")
                    return res.status(400).json({ error: "User Not Verified, Check your mail" })
                }
            }
        }

        const token = generateToken(
            {
                _id: user._id,
                name: user.name,
                picture: user.profilePic,
                email: is_user_uni ? user.universityEmail : user.personalEmail,
                email_verified: is_user_uni ? user.universityEmailVerified : user.personalEmailVerified
            },
            res
        );
        const newTokenToUser = await User.findByIdAndUpdate(
            { _id: user._id },
            {
                token: token,
            }
        );

        req.user = newTokenToUser;

        res.status(201).json({ token: token, mUserId: newTokenToUser._id });
    } catch (error) {
        // console.log("Error in- login-controller: ", error.message)
        res.status(500).json({ error: "Internal Server Error" });
        // throw new Error("Error in- login-controller: ", error)
    }
};

const logout = async (req, res) => {
    const { token } = req.body;
    try {
        // res.cookie("jwt", "", { maxAge: 0 })
        // console.log(req.user)
        const user = jwt.decode(token, process.env.JWT_SECRET);
        // console.log("The user", user)
        // console.log("The token", token)
        if (user) {
            fetch(`https://oauth2.googleapis.com/userinfo?token=${token}`)
                .then(async (userIn) => {
                    const email = user.email;
                    // console.log("here", email)

                    const allowedDomains = ["cuilahore", "cuiislamabad", "cuiabbottabad"];
                    const domainPattern = allowedDomains.join("|");
                    const universityEmailRegex = new RegExp(
                        `^(fa|sp)\\d{2}-(bcs|bse|baf|bai|bar|bba|bce|bch|bde|bec|bee|ben|bid|bmc|bph|bpy|bsm|bst|che|mel|pch|pcs|pec|pee|phm|pms|pmt|ppc|pph|pst|r06|rba|rch|rcp|rcs|rec|ree|rel|rms|rmt|rne|rph|rpm|rpy|rst)-\\d{3}@(${domainPattern})\\.edu\\.pk$`
                    );

                    // console.log("\nhere: 0", email, universityEmailRegex.test(email))
                    const regEx_Bool = universityEmailRegex.test(email);
                    let isFoundUser;
                    if (regEx_Bool) {
                        isFoundUser = await User.findOne({ universityEmail: email });
                        // console.log("\nhere: 1 ", isFoundUser)
                    } else {
                        isFoundUser = await User.findOne({ personalEmail: email });
                        // console.log("\nhere: 2 ", isFoundUser)
                    }
                    const access_token = isFoundUser.access_token;
                    // console.log("User is", isFoundUser)
                    fetch(
                        `https://www.googleapis.com/oauth2/v1/revoke?access_token=${access_token}`
                    )
                        .then(async (dataIn) => {
                            // console.log("Here to revoke")
                            if (regEx_Bool) {
                                isFoundUser = await User.findOneAndUpdate(
                                    { universityEmail: email },
                                    {
                                        token: "",
                                        refresh_token: "",
                                        access_token: "",
                                    }
                                );
                                // console.log("Here to revoke uni email", isFoundUser)
                            } else {
                                isFoundUser = await User.findOneAndUpdate(
                                    { personalEmail: email },
                                    {
                                        token: "",
                                        refresh_token: "",
                                        access_token: "",
                                    }
                                );
                                // console.log("Here to revoke personal email", isFoundUser)
                            }

                            return res.status(200).json({ message: "logged out" });
                        })
                        .catch((e) => {
                            res.status(400).json({ error: e });
                        });

                    // return res.status(200).json({ "message": "logged out" })
                })
                .catch((e) => {
                    return res.status(404).json({ error: e });
                });
        }
        // console.log("The user id", user.email)

        // req.user = undefined;
        // res.status(200).json({ message: "Logged Out" })
    } catch (error) {
        // console.log("Error in- logout-controller: ", error.message)
        res.status(500).json({ error: "Internal Server Error" });
        // throw new Error("Error in- logout-controller: ", error)
    }
};

// const logout = async (req, res) => {
//     const { token } = req.body;
//     try {
//         // res.cookie("jwt", "", { maxAge: 0 })
//         // console.log(req.user)
//         const user = jwt.decode(token, process.env.JWT_SECRET)
//         console.log(user)
//         console.log(token)
//         if (!user) {
//             fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`).then((user) => {
//                 console.log("Log out data: ", user)
//                 fetch(`https://oauth2.googleapis.com/revoke?token=${token}`,
//                     {
//                         method: "POST",
//                         headers: {
//                             "Content-type": "application/x-www-form-urlencoded"
//                         }
//                     }
//                 ).then(async (data) => {
//                     const universityEmailRegex = new RegExp(`^(fa|sp)\\d{2}-(bcs|bse|baf|bai|bar|bba|bce|bch|bde|bec|bee|ben|bid|bmc|bph|bpy|bsm|bst|che|mel|pch|pcs|pec|pee|phm|pms|pmt|ppc|pph|pst|r06|rba|rch|rcp|rcs|rec|ree|rel|rms|rmt|rne|rph|rpm|rpy|rst)-\\d{3}@(${domainPattern})\\.edu\\.pk$`);
//                     console.log("The data ", data);
//                     const email = data.email
//                     try {
//                         if (user.email.test(universityEmailRegex)) {
//                             const newTokenToUser = await User.findByIdAndUpdate({ universityEmail: email }, {
//                                 token: ''
//                             })
//                             console.log("Uni", newTokenToUser)
//                         } else {
//                             const newTokenToUser = await User.findByIdAndUpdate({ personalEmail: email }, {
//                                 token: ''
//                             })
//                             console.log("Not Uni", newTokenToUser)
//                         }
//                         return res.status(200).json({ message: "Logged Out" })
//                     } catch (error) {
//                         return res.status(404).json({ "error": error })
//                     }

//                     return res.status(200).json("ok")
//                 }).catch(e => {
//                     return res.status(404).json({ "error": e })
//                 })
//             }).catch(e => {
//                 return res.status(404).json({ "error": e })
//             })

//         }
//         console.log(user.userId)
//         const newTokenToUser = await User.findByIdAndUpdate({ _id: user.userId }, {
//             token: ''
//         })

//         console.log(newTokenToUser);
//         req.user = undefined;
//         res.status(200).json({ message: "Logged Out" })
//         // console.log("b", req.user)
//         // console.log("ba", req.user)
//     } catch (error) {
//         // console.log("Error in- logout-controller: ", error.message)
//         res.status(500).json({ error: "Internal Server Error" })
//         // throw new Error("Error in- logout-controller: ", error)
//     }
// }

module.exports = {
    signupR,
    updateInfoR,
    login,
    logout,
};
