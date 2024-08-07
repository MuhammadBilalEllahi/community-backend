

const { OAuth2Client } = require('google-auth-library');
const User = require('../models/user.model');
const bcryptjs = require("bcryptjs");
const { resendEmail } = require('./email.controller');

async function getUserData(access_token, user, req, res) {

    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);
    // console.log("Access Token", access_token)
    // console.log('response', response);
    const data = await response.json();
    // console.log('data', data); console.log('data', data.email, data.email_verified);

    const universityEmail_UserDB = await User.findOne({ universityEmail: data.email });
    const personalEmail_UserDB = await User.findOne({ personalEmail: data.email });

    // console.log("EMAil", universityEmail_UserDB, personalEmail_UserDB)


    if (!(Boolean(universityEmail_UserDB || personalEmail_UserDB))) {

        const allowedDomains = ["cuilahore", "cuiislamabad", "cuiabbottabad"];
        const domainPattern = allowedDomains.join('|');
        const universityEmailRegex = new RegExp(`^(fa|sp)\\d{2}-(bcs|bse|baf|bai|bar|bba|bce|bch|bde|bec|bee|ben|bid|bmc|bph|bpy|bsm|bst|che|mel|pch|pcs|pec|pee|phm|pms|pmt|ppc|pph|pst|r06|rba|rch|rcp|rcs|rec|ree|rel|rms|rmt|rne|rph|rpm|rpy|rst)-\\d{3}@(${domainPattern})\\.edu\\.pk$`);

        if (!(universityEmailRegex.test(data.email))) {
            return res.status(422).json({ message: "Only Organizational Accounts are Allowed to Signup \nor Signup on /register/student-type" })
        }
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

        await userCreate.save()
        if (userCreate) {


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
                <a href="https://community-backend-production-e156.up.railway.app/login" >Verify Comsian Account</a>
                `
            }

            await resendEmail(datas, req, res)

            return userCreate._id
        }
    } else {
        if (universityEmail_UserDB) {
            const Id = universityEmail_UserDB.universityEmail
            // console.log("The id: ", Id)
            const response = await User.findOneAndUpdate({ universityEmail: Id }, {
                access_token: user.access_token,
                token: user.id_token,
                refresh_token: user.refresh_token,
            }, { new: true, select: "_id" })
            // console.log("Uni Email Already Signed Up: ", response)
            return response._id

        }
        if (personalEmail_UserDB) {
            const Id = personalEmail_UserDB.personalEmail
            // console.log("The id: ", Id)
            const response = await User.findOneAndUpdate({
                personalEmail: Id
            }, {
                access_token: user.access_token,
                token: user.id_token,
                refresh_token: user.refresh_token,
            },
                { new: true, select: "_id" })
            // console.log("Personal Email Already Signed Up: ", response)
            return response._id
        }

    }

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
async function retryOAuth2ClientGetToken(oAuth2Client, code, retries = 2, delay = 1000) {
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

    console.log("The code is : ", code);
    try {
        const redirectURL = `${process.env.G_REDIRECT_URI}/oauth`
        const oAuth2Client = new OAuth2Client(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET,
            redirectURL
        );
        console.log("oatuht 2 clien t", oAuth2Client)
        const user = await retryOAuth2ClientGetToken(oAuth2Client, code);
        // await oAuth2Client.setCredentials(r.tokens);
        console.info('Tokens acquired.', user);
        // const user = oAuth2Client.credentials;
        console.log('credentials', user);
        const userId = await getUserData(oAuth2Client.credentials.access_token, user, req, res);
        if (userId.statusCode === 422) return;
        // console.log("User ID", userId.statusCode)
        let user_Id = userId.toString().split("'")[0];
        // console.log("USer id ", user_Id)

        res.redirect(303, `${process.env.G_REDIRECT_URI}/authorizing?sandbox_token=${user.id_token}&user=${user_Id}`);

        // res.status(200).json(`token: ${user.access_token}`) dont do this

    } catch (err) {
        console.log('Error logging in with OAuth2 user', err.message);
        if (err.code !== 'ERR_HTTP_HEADERS_SENT') {
            res.status(500).json({ "error": err.message })
        }


    }
    // console.log("Logged in redirecting...")
    // res.redirect(303, 'https://community-backend-production-e156.up.railway.app/login');

}



// Get User Info
const getUserDataFetch = async (req, res) => {

    res.setHeader('Access-Control-Allow-Origin', `${process.env.G_URI}`);
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