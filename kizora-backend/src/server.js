const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const streamRoutes = require('./routes/stream.routes');
const animeRoutes = require('./routes/anime.routes');
const providerRoutes = require('./routes/provider.routes');
const { initCatalogCron } = require('./jobs/updateCatalog');
const { getLiveStreamSources } = require('./controllers/stream.controller');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

// Initialize Automated Catalog Sync Cron Job
initCatalogCron();

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
app.use('/api/stream', streamRoutes);
app.get('/api/stream/:episodeId', getLiveStreamSources);
app.use('/api/anime', animeRoutes);
app.use('/api/provider', providerRoutes);

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
