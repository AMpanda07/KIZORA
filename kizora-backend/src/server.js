const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const streamRoutes = require('./routes/stream.routes');
const animeRoutes = require('./routes/anime.routes');
const providerRoutes = require('./routes/provider.routes');
// const { initCatalogCron } = require('./jobs/updateCatalog');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

// Initialize Automated Catalog Sync Cron Job
// initCatalogCron();

const app = express();

// ─── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ─── CORS ────────────────────────────────────────────────────────────────────
// Development: allow localhost:5173
// Production:  allow FRONTEND_URL env var (set in Render dashboard)
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Render health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true
}));

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ─── Health Endpoint ─────────────────────────────────────────────────────────
// Must respond even if DB or providers are down — used by Render for liveness
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'KIZORA API',
    timestamp: new Date().toISOString()
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);      // /api/auth/*
app.use('/api/stream',    streamRoutes);    // /api/stream/video/:episodeId
app.use('/api/anime',     animeRoutes);     // /api/anime (MongoDB catalog)
app.use('/api/provider',  providerRoutes);  // /api/provider/* (stream resolver)

// ─── API Root ─────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    service: 'KIZORA API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Required for Render — do not change to localhost

const server = app.listen(PORT, HOST, () => {
  console.log(`[SERVER] KIZORA API running on ${HOST}:${PORT} (${process.env.NODE_ENV || 'development'})`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
// Render sends SIGTERM before replacing/restarting the instance
const shutdown = (signal) => {
  console.log(`[SERVER] ${signal} received — shutting down gracefully`);
  server.close(() => {
    console.log('[SERVER] HTTP server closed');
    mongoose.connection.close(false).then(() => {
      console.log('[SERVER] MongoDB connection closed');
      process.exit(0);
    }).catch(() => {
      process.exit(0);
    });
  });

  // Force exit if graceful shutdown takes longer than 10 s
  setTimeout(() => {
    console.warn('[SERVER] Shutdown timeout exceeded — forcing exit');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
