import express from 'express';
import errorHandler from './middlewares/errorHandler';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth.routes';
import cookieParser from 'cookie-parser';
dotenv.config();

const app = express();
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Allow cookies to be sent with requests
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
// app.use("/api/items", itemRoutes);
app.use('/api/auth', authRouter);

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;
