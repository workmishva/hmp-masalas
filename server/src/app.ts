import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import dotenv from 'dotenv';
import connectDB from './config/database';
import orderRoutes from './routes/orderRoutes';
import userRoutes from './routes/userRoutes';

dotenv.config();

const app = express();

// 1. Set security HTTP headers     
app.use(helmet());

// 2. Limit requests from the same API to prevent brute force / DDoS
const limiter = rateLimit({
  max: 100, // Limit each IP to 100 requests per `window`
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// 3. Enable CORS for the frontend Vite server
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173' || 'http://localhost:5174',
  credentials: true
}));

// 4. Body parser, reading data from body into req.body and limiting payload size
app.use(express.json({ limit: '10kb' }));

// 5. Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// 6. Data sanitization against XSS (Cross-Site Scripting)
app.use(xss());

// 7. Mount secure routes
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

// Return 404 for undefined routes
app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB, then start the server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[SECURE SERVER] Backend running locally on port ${PORT}`);
    console.log(`[CORS] Accepting requests only from: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  });
});
