require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io for real-time features
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.socket.io"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws://localhost:*", "wss://localhost:*"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to API routes only
app.use('/api', limiter);

// Serve static files with proper permissions
app.use(express.static(path.join(__dirname), {
  index: 'index.html',
  dotfiles: 'ignore',
  etag: false,
  redirect: false
}));

app.use('/js', express.static(path.join(__dirname, 'public', 'js')));

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Check if route files exist before requiring them
const routesPath = path.join(__dirname, 'server', 'routes');
const authRoutesExist = fs.existsSync(path.join(routesPath, 'auth.js'));
const macRequestRoutesExist = fs.existsSync(path.join(routesPath, 'macRequests.js'));
const supportRoutesExist = fs.existsSync(path.join(routesPath, 'support.js'));
const systemRoutesExist = fs.existsSync(path.join(routesPath, 'system.js'));
const userRoutesExist = fs.existsSync(path.join(routesPath, 'users.js'));

// API Routes - only load if files exist
if (authRoutesExist) {
  const authRoutes = require('./server/routes/auth');
  app.use('/api/auth', authRoutes);
}

if (macRequestRoutesExist) {
  const macRequestRoutes = require('./server/routes/macRequests');
  app.use('/api/mac-requests', macRequestRoutes);
}

if (supportRoutesExist) {
  const supportRoutes = require('./server/routes/support');
  app.use('/api/support', supportRoutes);
}

if (systemRoutesExist) {
  const systemRoutes = require('./server/routes/system');
  app.use('/api/system', systemRoutes);
}

if (userRoutesExist) {
  const userRoutes = require('./server/routes/users');
  app.use('/api/users', userRoutes);
}

// Temporary mock API endpoints if routes don't exist
if (!authRoutesExist || !macRequestRoutesExist) {
  // Mock auth endpoint
  app.post('/api/auth/login', (req, res) => {
    res.json({
      success: true,
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: '1',
        email: req.body.email,
        firstName: 'Test',
        lastName: 'User',
        role: 'user'
      }
    });
  });

  // Mock MAC request endpoint
  app.post('/api/mac-requests', (req, res) => {
    res.json({
      success: true,
      data: {
        id: Date.now(),
        ticketNumber: `MAC-${Date.now()}`,
        ...req.body,
        status: 'pending',
        createdAt: new Date()
      }
    });
  });

  // Mock system status endpoint
  app.get('/api/system/status', (req, res) => {
    res.json({
      success: true,
      data: [
        { serviceName: 'Booking Engine', status: 'operational' },
        { serviceName: 'Payment Processing', status: 'operational' },
        { serviceName: 'Channel Manager', status: 'operational' },
        { serviceName: 'Staff Portal', status: 'operational' },
        { serviceName: 'Guest Portal', status: 'operational' },
        { serviceName: 'Reporting System', status: 'degraded' }
      ]
    });
  });
}

// Socket.io connection handling for real-time chat
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('chat-message', async (data) => {
    try {
      // Emit to all clients in the room
      io.to(data.roomId).emit('new-message', {
        id: Date.now(),
        message: data.message,
        sender: data.sender,
        timestamp: new Date(),
        type: data.type || 'user'
      });
    } catch (error) {
      console.error('Chat message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user-typing', {
      userId: data.userId,
      isTyping: data.isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: err.errors
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler - serve the 404 page
app.get('*', (req, res) => {
  const notFoundPath = path.join(__dirname, 'pvt-404-page.html');
  if (fs.existsSync(notFoundPath)) {
    res.sendFile(notFoundPath);
  } else {
    res.status(404).send('Page not found');
  }
});

// Database connection and server start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Check if database config exists
    const dbConfigPath = path.join(__dirname, 'server', 'config', 'database.js');
    if (fs.existsSync(dbConfigPath)) {
      const { sequelize } = require('./server/config/database');
      
      // Test database connection
      try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');
        
        // Sync database models (in production, use migrations instead)
        if (process.env.NODE_ENV !== 'production') {
          await sequelize.sync({ alter: true });
          console.log('✅ Database models synchronized.');
        }
      } catch (dbError) {
        console.log('⚠️ Database connection failed, running without database:', dbError.message);
      }
    } else {
      console.log('⚠️ Running without database (config not found)');
    }
    
    // Start server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Access the application at: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(async () => {
    console.log('HTTP server closed');
    
    const dbConfigPath = path.join(__dirname, 'server', 'config', 'database.js');
    if (fs.existsSync(dbConfigPath)) {
      const { sequelize } = require('./server/config/database');
      await sequelize.close();
      console.log('Database connection closed');
    }
    
    process.exit(0);
  });
});

startServer();

module.exports = { app, io };