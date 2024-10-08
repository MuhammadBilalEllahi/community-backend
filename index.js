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
const path = require('path');
// const RedisStore = require('connect-redis').default;
// const redisClient = require("./db/reddis.js")
// const Redis = require('ioredis');

dotenv.config()



// const redis = new Redis(process.env.REDIS_URL);
// redis.on('error', (err) => {
//     console.error('Redis error:', err);
// });
app.set('trust proxy', 1);
const sessionData = session({
    name: "THECOOK",
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: process.env.RESAVE === 'true',
    saveUninitialized: process.env.SAVE_UNINTIALIZED === 'true',
    cookie: {
        maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
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
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
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

const communityRouter = require('./routes/community/community.route.js');
const communityTypeRouter = require('./routes/community/communityType.route.js');
const postRouter = require('./routes/community/post.route.js');



const subCommunityRouter = require('./routes/community/sub/sub.community.route.js');
const subPostRouter = require('./routes/community/sub/sub.post.route.js');
// const membersRouter = require('./routes/community/members.route.js');

const campusRouter = require('./routes/campus.route.js');



app.use("/api/auth", authRouter)
app.use('/api/oauth', oAuthRouter);
app.use('/api/request', requestRoute);
app.use('/email', emailRoute);

app.use('/api/teachers', protectRoute, teacherRoute);
app.use("/api/department", protectRoute, departmentRouter)
app.use("/api/course", protectRoute, courseRouter)
app.use("/api/subject", protectRoute, subjectRouter)
app.use("/api/pastpapers", servePDFRouter)

app.use("/api/discussion", protectRoute, discussionRouter)
app.use("/api/comment", protectRoute, commentRouter)



app.use("/api/community", protectRoute, communityRouter)
app.use("/api/communityType", protectRoute, communityTypeRouter)
app.use("/api/post", protectRoute, postRouter)


app.use("/api/sub/community", protectRoute, subCommunityRouter)
app.use("/api/sub/post", protectRoute, subPostRouter)
// app.use("/api/members", protectRoute, membersRouter)

app.use("/api/campus", protectRoute, campusRouter)



app.use('/uploads/community', express.static(path.join(__dirname, '..', 'data', 'uploads', 'community')));
// app.get('/uploads/community/:communityId/:type/:filename', (req, res) => {
//     const { communityId, type, filename } = req.params;
//     const filePath = path.join(__dirname, 'data', 'uploads', 'community', communityId, type, filename);

//     res.sendFile(filePath, (err) => {
//         if (err) {
//             console.error('Error serving file:', err);
//             res.status(404).send('File not found');
//         }
//     });
// });






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

const discussionUsers = {}
const discussionUserCount = {}

io.on('connection', (socket) => {
    console.log('A user connected', socket.id);


    const userId = socket.handshake.query.userId
    // console.log("USer id", userId)

    socket.on('joinDiscussion', (discussionId) => {
        socket.join(discussionId);

        if (!discussionUsers[discussionId]) {
            discussionUsers[discussionId] = new Set()
        }


        discussionUsers[discussionId].add(socket.id)
        // console.log(discussionUsers)
        // console.log(discussionUsers[discussionId].size)

        io.to(discussionId).emit('users', discussionUsers)
        io.to(discussionId).emit('usersCount', discussionUsers[discussionId].size)

        console.log(`User joined discussion: ${discussionId}`);
    });

    socket.on('message', (discussionId, message) => {
        const chatMessage = { user: socket.id, message, timestamp: new Date() };
        io.to(discussionId).emit('message', chatMessage);
    });

    socket.on('disconnect', () => {
        Object.keys(discussionUsers).forEach(discussionId => {
            if (discussionUsers[discussionId].has(socket.id)) {
                discussionUsers[discussionId].delete(socket.id);
                discussionUserCount[discussionId] = discussionUsers[discussionId].size;


                io.to(discussionId).emit('users', discussionUsers)
                io.to(discussionId).emit('usersCount', discussionUsers[discussionId].size)
            }
        })
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


// const Campus = require('./models/campus/campus.model.js');
// const { setTimeout } = require("timers/promises");
// const f = async () => {

//     const campus = await Campus.findOne({ location: 'Lahore' }).populate('campusTeachers')
//     console.log(campus)
// }
// setTimeout(() => {
// f()
// }, 5000)



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







// TEST
// const mail = 'fa21-bcs-058@cuilahore.edu.pk'
// const allowedDomains = ["cuilahore", "cuiislamabad", "cuiabbottabad"];
// const domainPattern = allowedDomains.join('|');
// const universityEmailRegex = new RegExp(`^(fa|sp)\\d{2}-(bcs|bse|baf|bai|bar|bba|bce|bch|bde|bec|bee|ben|bid|bmc|bph|bpy|bsm|bst|che|mel|pch|pcs|pec|pee|phm|pms|pmt|ppc|pph|pst|r06|rba|rch|rcp|rcs|rec|ree|rel|rms|rmt|rne|rph|rpm|rpy|rst)-\\d{3}@(${domainPattern})\\.edu\\.pk$`);


// if (!(universityEmailRegex.test(mail))) {
//     return res.status(422).json({ message: "Only Organizational Accounts are Allowed to Signup \nor Signup on /register/student-type" })
// } else {

//     const emailDomainMatch = mail.match(new RegExp(`@(${domainPattern})\\.edu\\.pk$`));

//     if (emailDomainMatch) {
//         const matchedDomain = emailDomainMatch[1];
//         const val = matchedDomain.replace('cui', '')
//         const res = val.charAt(0).toUpperCase() + val.slice(1)
//         console.log("Matched Domain:", res);
//     }
// }



// FIND TEACHERZ
// const f=async()=>{

//     const teachers =await Teacher.find().select('_id')
//     console.log(teachers)
//     }
//     f()