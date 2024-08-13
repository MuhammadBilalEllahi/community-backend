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
const session = require('express-session')
const MongoStore = require('connect-mongo');
const protectRoute = require('./middlewares/protectRoute.js')
// const RedisStore = require('connect-redis').default;
// const redisClient = require("./db/reddis.js")
// const Redis = require('ioredis');

dotenv.config()



// const redis = new Redis(process.env.REDIS_URL);
// redis.on('error', (err) => {
//     console.error('Redis error:', err);
// });

const sessionData = session({
    name: "THECOOK",
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: process.env.RESAVE === 'true',
    saveUninitialized: process.env.SAVE_UNINTIALIZED === 'true',
    cookie: {
        maxAge: 60 * 60 * 1000, // 1 hour
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true if HTTPS in production
        sameSite: process.env.NODE_ENV === 'production' && 'lax',
        domain: process.env.COOKIE_DOMAIN || undefined
    },
    rolling: process.env.ROLLING === 'true',
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_DB_URI,
        collectionName: 'sessions',
        ttl: 14 * 24 * 60 * 60 // 14 days
    })
});

app.use(sessionData);


app.use(cors({
    origin: ["http://localhost:3000", "https://comsian.vercel.app", "https://comsian.bilalellahi.com"],
    credentials: true
}))
app.use(cookieParser())
app.use(morgan("dev"))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))






// const crypto = require('crypto')
// console.log(crypto.randomBytes(6).toString('hex'))
console.log("Production", process.env.NODE_ENV === 'production')
console.log("Production none? same site: ", process.env.NODE_ENV === 'production' ? 'none' : 'lax')


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
app.use('/api/oauth', oAuthRouter);
app.use('/api/request', requestRoute);
app.use('/email', emailRoute);

app.use('/api/teachers', protectRoute, teacherRoute);
app.use("/api/department", protectRoute, departmentRouter)
app.use("/api/course", protectRoute, courseRouter)
app.use("/api/subject", protectRoute, subjectRouter)
app.use("/api/pastpapers", protectRoute, servePDFRouter)

app.use("/api/discussion", protectRoute, discussionRouter)
app.use("/api/comment", protectRoute, commentRouter)


const startServer = () => {
    app.listen(PORT, () => {
        mongoDB()
        console.log(`Server Running on ${PORT}`)
    })
}


const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: ["http://localhost:3000", "https://comsian.vercel.app", "https://comsian.bilalellahi.com"],
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

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
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