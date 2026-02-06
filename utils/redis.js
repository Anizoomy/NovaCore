const { createClient } = require('redis');

const redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
        // If the connection drops, this logic decides how long to wait before trying again
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        // 'tls' stands for Transport Layer Security it's like 'https' for your database
        tls: true
    }
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err));

redisClient.on('connect', () => console.log('Redis Connection Established'));

//This is a self-running function (IIFE function) that handles the startup process
(async () => {
    try {
        // Check if the client is NOT already open to avoid double-connecting
        if (!redisClient.isOpen) {
            await redisClient.connect();
            console.log('Successfully connected with Upstash Redis');
        }
    } catch (error) {
        console.error('Failed to connect to Redis on startup:', error.message);
    }
})();

module.exports = redisClient;