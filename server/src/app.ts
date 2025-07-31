import express from 'express';
import errorHandler from './middlewares/errorHandler';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth.routes';
import userRouter from './routes/user.routes';
import travelPlanRouter from './routes/travelPlan.routes';
import cookieParser from 'cookie-parser';
import { logger, morganStream } from './utils/logger';
import commentActionRouter, { createCommentRoutes } from './routes/comment.routes';
import morgan from 'morgan';
import locationRouter from './routes/location.routes';
import { createLikeRoutes, likeRouter } from './routes/like.routes';
import discoveryRouter from './routes/discovery.routes';
dotenv.config();

const app = express();
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Allow cookies to be sent with requests
};
const morganFormat =
  ':method :url :status :res[content-length] - :response-time ms';

app.use(morgan(morganFormat, { stream: morganStream }));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/plans', travelPlanRouter);
app.use('/api/plans', createLikeRoutes('TravelPlan'));
// When you implement posts, add:
// import postRouter from './routes/post.routes';
// app.use('/api/posts', postRouter);
// app.use('/api/posts', createLikeRoutes('Post'));
app.use('/api/plans', createLikeRoutes('TravelPlan'));
app.use('/api/plans', createCommentRoutes('TravelPlan'));

app.use('/api/comments', commentActionRouter);
app.use('/api/likes', likeRouter);

app.use('/api/location', locationRouter);
app.use('/api/discovery', discoveryRouter);

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;
