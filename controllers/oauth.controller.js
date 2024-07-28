

const { OAuth2Client } = require('google-auth-library');
const User = require('../models/user.model');
const bcryptjs = require("bcryptjs");
const { resendEmail } = require('./email.controller');

async function getUserData(access_token, user, req, res) {

    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);
    // console.log("Access Token", access_token)
    //console.log('response',response);
    const data = await response.json();
    // console.log('data', data); console.log('data', data.email, data.email_verfied);

    const universityEmail_UserDB = await User.findOne({ universityEmail: data.email });
    const personalEmail_UserDB = await User.findOne({ personalEmail: data.email });


    if (!(!universityEmail_UserDB || !personalEmail_UserDB)) {
        const test_pass = data.email.split("@")[0]
        const emailDomain = data.email.split("@")[1]


        // console.log("split email ", test_pass, "and ", emailDomain)

        const isUniversityMail = emailDomain === "cuilahore.edu.pk" || emailDomain === "cuiislamabad.edu.pk";

        const universityEmailExpirationDate = getExpirationDate(isUniversityMail, test_pass)




        const saltRound = await bcryptjs.genSalt(10)
        const hashedPassowrd = await bcryptjs.hash(test_pass, saltRound)

        const userCreate = new User({
            universityEmail: isUniversityMail ? data.email : null,
            personalEmail: isUniversityMail ? null : data.email,
            password: hashedPassowrd,
            name: data.name,
            universityEmailVerified: isUniversityMail,
            personalEmailVerified: !isUniversityMail,
            profilePic: data.picture,
            access_token: user.access_token,
            token: user.id_token,
            refresh_token: user.refresh_token,
            google_EmailVerified: data.email_verified,
            username: test_pass,
            universityEmailExpirationDate: universityEmailExpirationDate

        })


        if (userCreate) {
            await userCreate.save()

            const datas = {
                name: data.name,
                email: data.email,
                subject: "Account Created!",
                message: "Thank You for Creating account in Comsats Colab",
                html: `
                <h2>Please Login to Your Account</p><br/> 
                <p>This are your passcode, Please change it as soon as you receive it.</p>
                Password: <strong>${test_pass}</strong>
                Username: <strong>${test_pass}</strong>
                <a href="http://localhost:3000/login" >www.localhost.com</a>
                `
            }

            await resendEmail(datas, req, res)
        }
    } else {
        if (universityEmail_UserDB) {
            const Id = universityEmail_UserDB.universityEmail
            // console.log("The id: ", Id)
            const response = await User.findOneAndUpdate({ universityEmail: Id }, {
                access_token: user.access_token,
                token: user.id_token,
                refresh_token: user.refresh_token,
            })
            // console.log("Uni Email Already Signed Up: ", response)
        }
        if (personalEmail_UserDB) {
            const Id = personalEmail_UserDB.personalEmail
            // console.log("The id: ", Id)
            const response = await User.findOneAndUpdate({
                universityEmail: Id
            }, {
                access_token: user.access_token,
                token: user.id_token,
                refresh_token: user.refresh_token,
            })
            console.log("Personal Email Already Signed Up: ", response)
        }

    }


    // console.log("The HD is ", data.hd)
    // if (data.email.includes("@cuilahore.edu.pk") && data.hd === 'cuilahore.edu.pk') {
    //     console.log("CUI Lahore")
    // }
    // else {
    //     console.log("Only CUI domains can login in")
    // }
}
function getExpirationDate(isUniversityMail, test_pass) {
    if (!isUniversityMail) {
        const endDate = new Date('02/25/2100')
        return endDate;
    } else {
        const data = test_pass;
        const session = data.split("-")[0].toLowerCase()
        const fall_or_spring = session.startsWith("fa") ? "fa" : "sp"
        const year = session.split(fall_or_spring)[1]

        const startDate = new Date(`0${fall_or_spring === "sp" ? "03" : "08"}/02/20${year}`) // month,date,year
        //console.log(startDate)
        const expirayDate = new Date(startDate.setFullYear(startDate.getFullYear() + 4))

        return expirayDate

    }

}
async function retryOAuth2ClientGetToken(oAuth2Client, code, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const r = await oAuth2Client.getToken(code);
            await oAuth2Client.setCredentials(r.tokens);
            return oAuth2Client.credentials;
        } catch (err) {
            console.log(`Attempt ${i + 1} failed: ${err.message}`);
            if (i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw err;
            }
        }
    }
}
/* GET home page. */
const getOAuthClient = async (req, res, next) => {

    const code = req.query.code;

    // console.log("The code is : ", code);
    try {
        const redirectURL = "http://localhost:3000/oauth"
        const oAuth2Client = new OAuth2Client(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET,
            redirectURL
        );
        const user = await retryOAuth2ClientGetToken(oAuth2Client, code);
        // await oAuth2Client.setCredentials(r.tokens);
        // console.info('Tokens acquired.');
        // const user = oAuth2Client.credentials;
        // console.log('credentials', user);
        await getUserData(oAuth2Client.credentials.access_token, user, req, res);


        res.redirect(303, `http://localhost:3000/login?sandbox_token=${user.id_token}`);

        // res.status(200).json(`token: ${user.access_token}`) dont do this

    } catch (err) {
        res.status(500).json({ "error": err.message })
        console.log('Error logging in with OAuth2 user', err);
    }
    // console.log("Logged in redirecting...")
    // res.redirect(303, 'http://localhost:3000/login');

}



// Get User Info
const getUserDataFetch = async (req, res) => {

    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    const { id_token } = req.query;
    // console.log("token is", id_token, "\n");

    try {
        const oAuth2Client = new OAuth2Client(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET
        );

        const ticket = await oAuth2Client.verifyIdToken({
            idToken: id_token,
            audience: process.env.CLIENT_ID,
        });

        const payload = ticket.getPayload();
        //console.log("User info:", payload);

        res.status(200).json({
            data: {
                email: payload.email,
                email_verified: payload.email_verified,
                picture: payload.picture,
                name: payload.name

            }
        });
    } catch (error) {
        console.error("Error verifying token:", error);
        res.status(404).json({ error: "Token verification failed" });
    }
};



module.exports = { getOAuthClient, getUserDataFetch };