const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const streamRoutes = require('./routes/stream.routes');
const animeRoutes = require('./routes/anime.routes');
const providerRoutes = require('./routes/provider.routes');
const { initCatalogCron } = require('./jobs/updateCatalog');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

// Initialize Automated Catalog Sync Cron Job
// initCatalogCron();

const app = express();

// Security and CORS Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());

// Routes Registration
app.use('/api/auth',      authRoutes);      // /api/auth/*
app.use('/api/stream',    streamRoutes);    // /api/stream/video/:episodeId (range-based local files)
app.use('/api/anime',     animeRoutes);     // /api/anime (MongoDB catalog)
app.use('/api/provider',  providerRoutes);  // /api/provider/* (Jikan + stream resolver)

// Health-check route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'KIZORA Automated Pipeline & HLS Aggregator API is running'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
