const Redis = require('ioredis');

const redis = new Redis({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    db: 0
});

redis.on('error', (err) => {
    console.error('Redis error:', err);
});

module.exports = redis;
