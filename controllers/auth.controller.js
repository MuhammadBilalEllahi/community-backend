const User = require("../models/user/user.model.js");
const bcryptjs = require("bcryptjs");
const generateToken = require("../utils/generate.token.js");
const { resendEmail } = require("./email.controller.js");
const jwt = require("jsonwebtoken");

const signupR = async (req, res) => {

    try {
        const { universityEmail, universityEmailPassword } = req.body;
        const user = await User.findOne({ universityEmail }).select('universityEmail');

        if (user) return res.status(400).json({ error: "Invalid Keys" }); // do not tell user if such account already exists
        // fa21-bcs-058


        const allowedDomains = ["cuilahore", "cuiislamabad", "cuiabbottabad"];
        const domainPattern = allowedDomains.join('|');
        const universityEmailRegex = new RegExp(`^(fa|sp)\\d{2}-(bcs|bse|baf|bai|bar|bba|bce|bch|bde|bec|bee|ben|bid|bmc|bph|bpy|bsm|bst|che|mel|pch|pcs|pec|pee|phm|pms|pmt|ppc|pph|pst|r06|rba|rch|rcp|rcs|rec|ree|rel|rms|rmt|rne|rph|rpm|rpy|rst)-\\d{3}@(${domainPattern})\\.edu\\.pk$`);

        if (!(universityEmailRegex.test(universityEmail))) {
            return res.status(422).json({ message: "Only Organizational Accounts are Allowed to Signup \nor Signup on /register/student-type" })
        }

        const emailDomainMatch = universityEmail.match(new RegExp(`@(${domainPattern})\\.edu\\.pk$`));
        let resultantLocation = ''
        if (emailDomainMatch) {
            const matchedDomain = emailDomainMatch[1];

            const val = matchedDomain.replace('cui', '')
            resultantLocation = val.charAt(0).toUpperCase() + val.slice(1)
            console.log("Matched Domain:", resultantLocation);
        }




        const saltRound = await bcryptjs.genSalt(10);
        const hashedPassowrd = await bcryptjs.hash(
            universityEmailPassword,
            saltRound
        );
        const username = universityEmail.split("@")[0];
        const userCreate = new User({
            universityEmail: universityEmail,
            password: hashedPassowrd,
            username: username,
            profile: {
                location: resultantLocation
            }
        });

        if (userCreate) {
            // const token = await generateToken(
            //     {
            //         _id: userCreate._id,
            //         name: userCreate.name,
            //         picture: userCreate.profilePic,
            //         email: userCreate.universityEmail,
            //         email_verified: userCreate.universityEmailVerified
            //     },
            //     res
            // );
            await userCreate.save();

            const datas = {
                name: "",
                email: universityEmail,
                subject: "Account Activation - Test",
                message:
                    "Please Activate your account within 7 day, otherwise your record will be deleted. To ensure security, this policy is implemented \n Link will be expired once use and within a day",
                html: `
                <h2> Please Follow this Link to Activate Account</p><br/> 
                <a href="${process.env.G_REDIRECT_URI}/auth/registered/update-info?id=${userCreate._id}" >Activate Here</a>
                `,
            };

            await resendEmail(datas, req, res);

            res.status(200).json({ message: "Account will be deleted if not activated within a week", });

        } else {
            res.status(400).json({ error: "Invalid User Data" });
        }
    } catch (error) {
        console.error("Error in- signup-registered-student-controller: ", error.message);
        res.status(500).json({ error: "Internal Server Error" });
        // throw new Error("Error in- signup-controller: ", error)
    }
};





const MAX_URLS = 10;

const validateUrls = (urls) => {
    if (!Array.isArray(urls)) {
        return false;
    }
    if (urls.length > MAX_URLS) {
        return false;
    }
    return urls.every(url => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    });
};

const updateInfoR = async (req, res) => {
    const { username, personalEmail, phoneNumber, urls } = req.body;
    const { id } = req.query;
    // console.log("\nID: ", id, "\nand", username, personalEmail, phoneNumber, urls, "\n")
    try {
        const decodedJwt = jwt.decode(id, process.env.JWT_SECRET);
        // console.log("\nDecoded:", decodedJwt, "\n")

        const _id = decodedJwt._id;
        // console.log(_id)
        const findUser = await User.findOne({ _id: _id });
        // console.log(findUser)
        if (!findUser) return res.status(404).json({ message: "Invalid or expired token" });


        const isUserWithSamePersonalEmailExists = await User.findOne({ personalEmail: personalEmail });
        if (isUserWithSamePersonalEmailExists) return res.status(304).json({ message: "Invalid personal email or exists already" });//email already exists

        // if(findUser.universityEmailVerified) return
        // if (!validateUrls(urls)) {
        //     return res.status(400).json({ message: `Invalid URLs format or exceeds limit` });
        // }


        const jwtToken = await generateToken(
            {
                _id: findUser._id,
                name: findUser.name,
                picture: findUser.profilePic,
                email: findUser.universityEmail,
                email_verified: findUser.universityEmailVerified
            },
            res
        );
        const response = await User.findOneAndUpdate(
            { _id: findUser._id },
            {
                username,
                personalEmail: personalEmail,
                personalEmailVerified: true,
                phoneNumber,
                token: jwtToken,
                universityEmailVerified: true,
                urls
            }
        );
        const datas = {
            name: "",
            email: findUser.universityEmail,
            subject: "Account Activated - Test",
            message: "Thanks For Securing Your Account",
            html: `
            <h2> Now You Can Login to Your Account</p><br/> 
            <a href="${process.env.G_REDIRECT_URI}/login" >Login To Your Account</a>
            `,
        };

        await resendEmail(datas, req, res);

        // console.log(response)

        res.status(200).json({ message: "Success", token: jwtToken });
    } catch (error) {
        console.error(
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
                    // console.log("universityEmailVerified Not")
                    return res.status(400).json({ error: "User Not Verified, Check your mail" })
                }
            } else if (!is_user_uni) {
                if (!user.universityEmailVerified) {
                    // console.log("personalEmailVerified Not")
                    return res.status(400).json({ error: "User Not Verified, Check your mail" })
                }
            }
        }

        const userIdSplit = user._id.toString().split("'")[0]
        // console.log("SPLiyef id ", userIdSplit)

        req.session.user = {
            _id: userIdSplit,
            name: user.name,
            email: user.universityEmail ? user.universityEmail : user.personalEmail,
            picture: user.profilePic,
            username: user.username

        };

        // console.log("The session data is ", req.session)
        req.session.save((err) => {
            if (err) {
                console.log('Session save error:', err);
                return res.status(500).json({ error: "Internal Server Error" });
            }
            // console.log("Session user in Longin Controller : ", req.session.user)
            return res.status(201).json(req.session.user);
        });


        // console.log("Session user in Longin Controller : ", req.session.user)

        // res.status(201).json(req.session.user);
    } catch (error) {
        console.error("Error in- login-controller: ", error.message)
        res.status(500).json({ error: "Internal Server Error" });
        // throw new Error("Error in- login-controller: ", error)
    }
};



const session = async (req, res) => {

    // console.log("Req user:", req.session.user)
    // console.log("The session data is in session ", req.session)
    if (req.session.user) {
        res.status(200).json({
            _id: req.session.user._id,
            name: req.session.user.name,
            email: req.session.user.email,
            picture: req.session.user.picture,
            username: req.session.user.username,
            token: req.session.user.token
        });


    } else {
        res.status(401).json({ error: "Not authenticated" });
    }

}

// const logout = async (req, res) => {
//     const token = req.session.user?.token;

//     console.log("Log out controller", req.session);
//     try {
//         if (token) {
//             const user = jwt.decode(token, process.env.JWT_SECRET);
//             console.log("Log out controller User", user)
//             if (user) {
//                 try {
//                     const email = user.email;
//                     const allowedDomains = ["cuilahore", "cuiislamabad", "cuiabbottabad"];
//                     const domainPattern = allowedDomains.join("|");
//                     const universityEmailRegex = new RegExp(
//                         `^(fa|sp)\\d{2}-(bcs|bse|baf|bai|bar|bba|bce|bch|bde|bec|bee|ben|bid|bmc|bph|bpy|bsm|bst|che|mel|pch|pcs|pec|pee|phm|pms|pmt|ppc|pph|pst|r06|rba|rch|rcp|rcs|rec|ree|rel|rms|rmt|rne|rph|rpm|rpy|rst)-\\d{3}@(${domainPattern})\\.edu\\.pk$`
//                     );

//                     const regEx_Bool = universityEmailRegex.test(email);
//                     let isFoundUser;

//                     if (regEx_Bool) {
//                         isFoundUser = await User.findOne({ universityEmail: email });
//                     } else {
//                         isFoundUser = await User.findOne({ personalEmail: email });
//                     }

//                     const access_token = isFoundUser.access_token;


//                     const revokeResponse = await fetch(
//                         `https://www.googleapis.com/oauth2/v1/revoke?access_token=${access_token}`
//                     );

//                     if (revokeResponse.ok) {
//                         const updateFields = {
//                             token: "",
//                             refresh_token: "",
//                             access_token: "",
//                         };

//                         if (regEx_Bool) {
//                             await User.findOneAndUpdate({ universityEmail: email }, updateFields);
//                         } else {
//                             await User.findOneAndUpdate({ personalEmail: email }, updateFields);
//                         }


//                         req.session.destroy(err => {
//                             if (err) {
//                                 return res.status(400).json({ error: err });
//                             }
//                             res.clearCookie('connect.sid', { path: '/' });
//                             return res.status(200).json({ message: "Logged Out" });
//                         });
//                     } else {
//                         return res.status(400).json({ error: "Failed to revoke access token" });
//                     }
//                 } catch (error) {
//                     console.error("Error during token revocation or user update:", error);
//                     return res.status(500).json({ error: "Internal Server Error" });
//                 }
//             } else {
//                 return res.status(400).json({ error: "Invalid token" });
//             }
//         } else {

//             req.session.destroy(err => {
//                 if (err) {
//                     return res.status(400).json({ error: err });
//                 }
//                 res.clearCookie('connect.sid', { path: '/' });
//                 return res.status(200).json({ message: "Logged Out" });
//             });
//         }
//     } catch (error) {
//         console.error("Error in logout controller:", error.message);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// };


const logout = async (req, res) => {
    const token = req.session.user?.token

    // console.log("Log out", req.session.user)
    try {

        if (token) {

            const user = jwt.decode(token, process.env.JWT_SECRET);

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

                                req.session.destroy(err => {
                                    if (err) {
                                        return res.status(400).json({ error: err })
                                    } else {
                                        res.clearCookie('connect.sid', { path: '/' });
                                        return res.status(200).json({ message: "Loggeed Out" })
                                    }
                                })

                                // return res.status(200).json({ message: "logged out" });
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

        } else {
            req.session.destroy(err => {
                if (err) {
                    return res.status(400).json({ error: err })
                } else {
                    res.clearCookie('connect.sid', { path: '/' });
                    return res.status(200).json({ message: "Loggeed Out" })
                }
            })
        }


    } catch (error) {
        // console.error("Error in- logout-controller: ", error.message)
        res.status(500).json({ error: "Internal Server Error" });
        // throw new Error("Error in- logout-controller: ", error)
    }
};

module.exports = {
    signupR,
    updateInfoR,
    login,
    session,
    logout,
};
