const redis = require('redis');

const client = redis.createClient({
    url: 'redis://localhost:6379'
});

client.on('error', (err) => console.error('Redis Client Error', err));
const startRedis = async () => {
    await client.connect();
}
startRedis()

module.exports = client;
