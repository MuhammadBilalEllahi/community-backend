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
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}))


dotenv.config()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))



const authRouter = require("./routes/authRoute")
const oAuthRouter = require('./routes/oauth');
const requestRoute = require('./routes/request');
const emailRoute = require('./routes/email.route.js');


app.use("/api/auth", authRouter)
app.use('/oauth', oAuthRouter);
app.use('/request', requestRoute);
app.use('/email', emailRoute);
// app.use("/request", authRouter)


app.listen(PORT, () => {
    mongoDB()
    console.log(`Server Running on ${PORT}`)
})


console.log(!(!false || !true))
console.log(!(!true || !false))
console.log(!(!false || !false))
console.log(!(!true || !true))
