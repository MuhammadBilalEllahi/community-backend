const { OAuth2Client } = require("google-auth-library");



const loginWithGoogle = async (req, res, next) => {
    res.header("Access-Control-Allow-Origin", `${process.env.G_REDIRECT_URI}`);
    res.header("Access-Control-Allow-Credentials", 'true');
    res.header("Referrer-Policy", "no-referrer-when-downgrade");
    const redirectURL = `${process.env.G_REDIRECT_URI}/oauth`;

    const oAuth2Client = new OAuth2Client(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        redirectURL
    );




    // Generate the url that will be used for the consent dialog.
    const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/userinfo.profile   openid ', 'https://www.googleapis.com/auth/userinfo.email   openid '],
        prompt: 'consent',
        hd: "cuilahore.edu.pk"
    });

    // console.log("Auth url: ", authorizeUrl)

    res.json({ url: authorizeUrl })
}



module.exports = { loginWithGoogle }