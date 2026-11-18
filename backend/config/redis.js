const { createClient } = require('redis');

let redisClient = null;

/**
 * Redis is an optional performance enhancement for local and demo installs.
 * The API must remain available when no Redis service is configured.
 */
async function connectRedis() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.log('Redis not configured; continuing without cache');
    return null;
  }

  try {
    redisClient = createClient({ url: redisUrl });
    redisClient.on('error', (error) => console.warn('Redis error:', error.message));
    await redisClient.connect();
    console.log('Redis connected');
    return redisClient;
  } catch (error) {
    console.warn('Redis connection unavailable; continuing without cache:', error.message);
    redisClient = null;
    return null;
  }
}

function getRedisClient() {
  return redisClient;
}

module.exports = { connectRedis, getRedisClient };
