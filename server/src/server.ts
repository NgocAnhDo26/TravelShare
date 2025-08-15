import app from './app';
import config from './config/config';
import './config/db.config';
import cron from 'node-cron';
import { updateTrendingScores } from './jobs/trending';
import { safeInitializeSearchIndexes } from './config/searchIndexes';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import {
  registerSocketUser,
  unregisterSocketUser,
} from './controllers/notification.controller';
import { setIO } from './config/socket.config';

// Initialize search indexes on startup
safeInitializeSearchIndexes();

// --- Background Job Scheduling ---
// Schedule the trending score update to run every 30 minutes.
// The cron syntax '*/30 * * * *' means:
// *: every minute, second, day of month, month, day of week
// */30: at every 30th unit
cron.schedule('*/30 * * * *', () => {
  console.log('-------------------------------------');
  console.log('Triggering scheduled trending score update...');
  updateTrendingScores();
  console.log('-------------------------------------');
});

// Setup Redis for storing socket clients
const client = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : undefined,
  },
});

client.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
  try {
    await client.connect();
    console.log('Redis connected successfully!');
  } catch (err) {
    console.error('Redis connection or operation failed:', err);
  }
})();

// Socket server for handling notifications
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

// Expose io globally so services/controllers can access it without relying on req.io
setIO(io);

app.use((req, res, next) => {
  req.io = io;
  next();
});

// Delegate socket connection logic to the controller functions
io.on('connection', (socket) => {
  console.log(`[Socket] A user connected: ${socket.id}`);

  socket.on('register', (userId: string) => {
    registerSocketUser(userId, socket.id);
  });

  socket.on('disconnect', () => {
    unregisterSocketUser(socket.id);
  });
});

server.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`);
  console.log('Trending score update job scheduled to run every 30 minutes.');
});
