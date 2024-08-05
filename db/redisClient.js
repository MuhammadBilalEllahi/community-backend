
// const Redis = require('ioredis');

// const redis = new Redis({
//     port: process.env.REDIS_PORT,
//     host: process.env.REDIS_HOST,
//     password: process.env.REDIS_PASSWORD,
//     db: 0
// });

// redis.on('error', (err) => {
//     console.error('Redis error:', err);
// });

// module.exports = redis;

const redis = require('redis');

const client = redis.createClient({
    url: process.env.REDIS_URL
});

client.on('error', (err) => console.error('Redis Client Error', err));
const startRedis = async () => {
    await client.connect();
}
startRedis()

// module.exports = client;
