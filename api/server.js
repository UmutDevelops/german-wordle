const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');

// Routes
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');

// Socket handlers
const setupSocketHandlers = require('./utils/socketHandlers');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io'
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Routes - Prefixed with /api
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Base route for API
app.get('/api', (req, res) => {
  res.status(200).json({ message: 'Almanca Wordle API' });
});

// Socket.io connection
setupSocketHandlers(io);

// Handle all other routes for Vercel serverless deployment
app.all('*', (req, res) => {
  // Diğer tüm route'ları API sunucusu tarafından işlenen yollara yönlendirelim
  // Vercel'de frontend Next.js tarafından ele alınacak
  if (req.url.startsWith('/api') || req.url.startsWith('/socket.io')) {
    res.status(404).json({ message: 'API route not found' });
  } else {
    // Diğer tüm istekler frontend uygulamasına gitmeli
    res.status(404).json({ message: 'Not found' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// For Vercel serverless deployment
module.exports = app;