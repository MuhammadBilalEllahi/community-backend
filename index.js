const express = require("express")
const app = express()
const PORT = process.env.PORT || 8080

const dotenv = require("dotenv")
const bodyParser = require("body-parser");
const cors = require("cors")
const morgan = require("morgan")
const cookieParser = require("cookie-parser")
const mongoDB = require("./db/connect.mongodb.js")





app.use(cookieParser())
app.use(morgan("dev"))
app.use(cors())


dotenv.config()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))



const authRouter = require("./routes/authRoute")
const oAuthRouter = require('./routes/oauth');
const requestRoute = require('./routes/request');


app.use("/api/auth", authRouter)
app.use('/oauth', oAuthRouter);
app.use('/request', requestRoute);
// app.use("/request", authRouter)


app.listen(PORT, () => {
    console.log(`Server Running on ${PORT}`)
})
