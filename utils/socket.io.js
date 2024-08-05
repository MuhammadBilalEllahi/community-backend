// const http = require('http');
// const socketIo = require('socket.io');
// const connectToMongoDB = require('../db/connect.mongodb');

// const startSocketIo = (app, PORT) => {
//     const server = http.createServer(app);
//     const io = socketIo(server, {
//         cors: {
//             origin: "https://community-backend-production-e156.up.railway.app/",
//             methods: ["GET", "POST"]
//         }
//     });

//     io.on('connection', (socket) => {
//         console.log('A user connected');

//         socket.on('joinDiscussion', (discussionId) => {
//             socket.join(discussionId);
//             console.log(`User joined discussion: ${discussionId}`);
//         });

//         socket.on('message', (discussionId, message) => {
//             const chatMessage = { user: socket.id, message, timestamp: new Date() };
//             io.to(discussionId).emit('message', chatMessage);
//         });

//         socket.on('disconnect', () => {
//             console.log('A user disconnected');
//         });
//     });

//     server.listen(PORT, () => {
//         connectToMongoDB();
//         console.log(`Server Running on ${PORT}`);
//     });
// }

// module.exports = { startSocketIo }
