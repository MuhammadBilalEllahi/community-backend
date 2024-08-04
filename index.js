// const cluster = require('cluster');
// const os = require('os');
const express = require("express")
const app = express()
const PORT = process.env.PORT || 8080

const http = require('http');
const socketIo = require('socket.io');

const dotenv = require("dotenv")
const bodyParser = require("body-parser");
const cors = require("cors")
const morgan = require("morgan")
const cookieParser = require("cookie-parser")
const mongoDB = require("./db/connect.mongodb.js")


app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}))


app.use(cookieParser())
app.use(morgan("dev"))


dotenv.config()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))



const authRouter = require("./routes/authRoute")
const oAuthRouter = require('./routes/oauth');
const requestRoute = require('./routes/request');
const emailRoute = require('./routes/email.route.js');

const teacherRoute = require('./routes/teacher.route.js');
const departmentRouter = require('./routes/courseRoute/department.route.js');
const courseRouter = require('./routes/courseRoute/course.route.js');
const subjectRouter = require('./routes/courseRoute/subject.route.js');
const servePDFRouter = require('./routes/courseRoute/servePDF.route.js');

const discussionRouter = require('./routes/discussion/discussion.route.js');
const commentRouter = require('./routes/discussion/comment.route.js');


app.use("/api/auth", authRouter)
app.use('/oauth', oAuthRouter);
app.use('/request', requestRoute);
app.use('/email', emailRoute);

app.use('/api/teachers', teacherRoute);
app.use("/department", departmentRouter)
app.use("/course", courseRouter)
app.use("/subject", subjectRouter)
app.use("/pastpapers", servePDFRouter)

app.use("/discussion", discussionRouter)
app.use("/comment", commentRouter)


const startServer = () => {
    app.listen(PORT, () => {
        mongoDB()
        console.log(`Server Running on ${PORT}`)
    })
}


const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('A user connected', socket.id);

    socket.on('joinDiscussion', (discussionId) => {
        socket.join(discussionId);
        console.log(`User joined discussion: ${discussionId}`);
    });

    socket.on('message', (discussionId, message) => {
        const chatMessage = { user: socket.id, message, timestamp: new Date() };
        io.to(discussionId).emit('message', chatMessage);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

server.listen(PORT, () => {
    mongoDB();
    console.log(`Server Running on ${PORT}`);
});





// startServer()




// if (cluster.isMaster) {
//     const numCPUs = os.cpus().length;

//     console.log(`Master ${process.pid} is running`);

//     for (let i = 0; i < numCPUs; i++) {
//         cluster.fork();
//     }

//     cluster.on('exit', (worker, code, signal) => {
//         console.log(`Worker ${worker.process.pid} died`);
//     });
// } else {
//     startServer();
// }