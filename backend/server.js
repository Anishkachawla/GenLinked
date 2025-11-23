import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import articlesRouter from './routes/articles.js';

// Load environment variables FIRST
dotenv.config();

// Verify environment variables are loaded
console.log('\n🔍 Checking environment variables...');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Loaded' : '❌ Missing');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Loaded' : '❌ Missing');

if (!process.env.MONGODB_URI) {
  console.error('\n❌ FATAL ERROR: MONGODB_URI not found in environment variables!');
  console.error('Please create a .env file in the backend folder with:');
  console.error('MONGODB_URI=your_mongodb_connection_string\n');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'GenLinked API Server',
    status: 'running'
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    mongodb: process.env.MONGODB_URI ? 'configured' : 'not configured',
    gemini: process.env.GEMINI_API_KEY ? 'configured' : 'not configured'
  });
});

app.use('/api/articles', articlesRouter);

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Internal server error' 
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}`);
  console.log(`🔍 Health: http://localhost:${PORT}/health\n`);
});
