import { createClient } from 'redis';

// Setup Redis client
const redisClient = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : undefined,
  },
});

redisClient.on('error', (err) => console.error('[Redis] Client Error', err));

// Connect the client immediately
(async () => {
  try {
    await redisClient.connect();
    console.log('[Redis] Client connected successfully!');
  } catch (err) {
    console.error('[Redis] Connection failed:', err);
  }
})();

export default redisClient;