import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import muCheckerRoutes from './routes/mutChecker.js';

console.log('✅ Imports successful');
console.log('🔑 Environment check - PINATA_JWT:', process.env.PINATA_JWT ? 'Loaded ✓' : 'Missing ✗');

// Initialize Express app
const app = express();

// Environment variables
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const batchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: 'Too many batch requests, please try again later.'
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ChainProof API is running',
    version: '1.0.0',
    endpoints: {
      muChecker: '/api/mu-checker',
      health: '/health'
    },
    timestamp: new Date().toISOString()
  });
});

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Apply stricter rate limiting to batch endpoints (must be before the route definitions)
app.use('/api/mu-checker/batch-risk', batchLimiter);
app.use('/api/mu-checker/batch-classify', batchLimiter);

// Use routes
app.use('/api/mu-checker', muCheckerRoutes);

// Global health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'POST /api/mu-checker/analyze',
      'POST /api/mu-checker/risk-score',
      'POST /api/mu-checker/full-analysis',
      'POST /api/mu-checker/batch-risk',
      'POST /api/mu-checker/batch-classify',
      'GET /api/mu-checker/health'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: NODE_ENV === 'development' ? err.message : 'Internal server error',
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (NODE_ENV === 'development') {
    process.exit(1);
  }
});

// Start server (only when not in Vercel serverless environment)
if (process.env.VERCEL !== '1') {
  const server = app.listen(PORT, () => {
    console.log('=================================');
    console.log(`🚀 ChainProof API Server`);
    console.log(`📡 Environment: ${NODE_ENV}`);
    console.log(`🌐 Port: ${PORT}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log('=================================');
    console.log('Available endpoints:');
    console.log(`  GET  http://localhost:${PORT}/`);
    console.log(`  GET  http://localhost:${PORT}/health`);
    console.log(`  POST http://localhost:${PORT}/api/mu-checker/analyze`);
    console.log(`  POST http://localhost:${PORT}/api/mu-checker/risk-score`);
    console.log(`  POST http://localhost:${PORT}/api/mu-checker/full-analysis`);
    console.log(`  POST http://localhost:${PORT}/api/mu-checker/batch-risk`);
    console.log(`  POST http://localhost:${PORT}/api/mu-checker/batch-classify`);
    console.log(`  GET  http://localhost:${PORT}/api/mu-checker/health`);
    console.log('=================================');
  });

  // Graceful shutdown (only for local server)
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

// Export for Vercel serverless
export default app;