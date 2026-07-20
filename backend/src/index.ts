import dotenv from 'dotenv';
// Load environment variables immediately before any other imports
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import apiRoutes from './routes/api';

const app = express();
const PORT = process.env.BACKEND_PORT || 5050;

// Connect to Database
connectDB();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per 15 mins
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: 'draft-6',
  legacyHeaders: false,
});

// Apply rate limiter to all API routes
app.use('/api', apiLimiter);

// Database Connection Check Middleware
app.use('/api', (req, res, next) => {
  const isConnected = mongoose.connection.readyState === 1;
  const isBypassedRoute = 
    req.path.startsWith('/auth') || 
    req.path.startsWith('/ai') || 
    req.path.startsWith('/chat') ||
    req.path.startsWith('/services') ||
    req.path.startsWith('/portfolio') ||
    req.path.startsWith('/testimonials') ||
    req.path.startsWith('/team') ||
    req.path.startsWith('/faqs');

  if (!isBypassedRoute && !isConnected) {
    res.status(503).json({
      success: false,
      message: 'MongoDB database is offline. Please start MongoDB locally or check your MONGODB_URI connection configuration.'
    });
    return;
  }
  next();
});

import swaggerDocument from './swagger.json';

// Swagger Spec endpoint
app.get('/api/swagger.json', (req, res) => {
  res.json(swaggerDocument);
});

// Interactive Swagger UI documentation page
app.get('/api-docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Outpro.India API Reference Docs</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
      <style>
        body { margin: 0; background: #0b0b0f; }
        .swagger-ui { filter: invert(90%) hue-rotate(180deg); }
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info .title { color: #5f1ed2; }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
      <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
            url: '/api/swagger.json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIStandalonePreset
            ],
            layout: "StandaloneLayout"
          });
        };
      </script>
    </body>
    </html>
  `);
});

// API Routes
app.use('/api', apiRoutes);


// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// 404 handler middleware
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack || err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
});

// Graceful shutdown handler
const gracefulShutdown = () => {
  console.log('Received shutdown signal. Closing server...');
  server.close(async () => {
    console.log('Express server closed.');
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
      process.exit(0);
    } catch (err) {
      console.error('Error during MongoDB connection close:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
