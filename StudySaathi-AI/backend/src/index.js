require('dotenv').config();
const express = require('express');
const cors = require('cors');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 8080; // Cloud Run uses 8080 by default

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, /\.web\.app$/, /\.firebaseapp\.com$/]
    : '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Request logging with more details
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  console.log(`  Origin: ${req.get('origin') || 'N/A'}`);
  console.log(`  User-Agent: ${req.get('user-agent')?.substring(0, 50) || 'N/A'}`);
  next();
});

// Health check
app.get('/', (_, res) => {
  res.json({ message: 'Welcome to StudySaathi AI API', status: 'running' });
});

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
console.log('Loading AI routes...');
app.use('/api/ai', aiRoutes);
console.log('AI routes loaded');

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 StudySaathi API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 Gemini API Key: ${process.env.GEMINI_API_KEY ? '✓ Configured' : '✗ Missing'}`);
  console.log(`🔥 Firebase: ${process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? '✓ Configured' : '✗ Missing'}`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`📋 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`${'='.repeat(50)}\n`);
});
