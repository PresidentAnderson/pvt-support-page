require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

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

// Basic middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname), {
  index: 'index.html'
}));

app.use('/js', express.static(path.join(__dirname, 'public', 'js')));

// Serve the main page (dashboard)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Serve individual pages
app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/support', (req, res) => {
  res.sendFile(path.join(__dirname, 'support-page.html'));
});

// Mock API endpoints for demo
app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    token: 'demo-token-' + Date.now(),
    refreshToken: 'demo-refresh-' + Date.now(),
    user: {
      id: '1',
      email: req.body.email || 'demo@pvthostel.ca',
      firstName: 'Demo',
      lastName: 'User',
      role: 'user',
      organization: {
        id: '1',
        name: 'PVT Hostel - Main',
        code: 'pvt-main'
      }
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    token: 'demo-token-' + Date.now(),
    refreshToken: 'demo-refresh-' + Date.now(),
    user: {
      id: Date.now().toString(),
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      role: 'user',
      organization: {
        id: '1',
        name: 'PVT Hostel - Main',
        code: 'pvt-main'
      }
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({
    success: true,
    user: {
      id: '1',
      email: 'demo@pvthostel.ca',
      firstName: 'Demo',
      lastName: 'User',
      role: 'user',
      organization: {
        id: '1',
        name: 'PVT Hostel - Main',
        code: 'pvt-main'
      }
    }
  });
});

app.post('/api/mac-requests', (req, res) => {
  const ticketNumber = `MAC-${new Date().getFullYear().toString().substr(-2)}${('0' + (new Date().getMonth() + 1)).slice(-2)}-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`;
  
  res.json({
    success: true,
    data: {
      id: Date.now(),
      ticketNumber: ticketNumber,
      ...req.body,
      status: 'pending',
      createdAt: new Date(),
      organization: {
        name: 'PVT Hostel - Main'
      },
      requester: {
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@pvthostel.ca'
      }
    }
  });
});

app.get('/api/system/status', (req, res) => {
  res.json({
    success: true,
    data: [
      { serviceName: 'Booking Engine', status: 'operational', uptime: 99.9 },
      { serviceName: 'Payment Processing', status: 'operational', uptime: 99.95 },
      { serviceName: 'Channel Manager', status: 'operational', uptime: 99.8 },
      { serviceName: 'Staff Portal', status: 'operational', uptime: 99.99 },
      { serviceName: 'Guest Portal', status: 'operational', uptime: 99.9 },
      { serviceName: 'Reporting System', status: 'degraded', uptime: 95.5 }
    ]
  });
});

// Support endpoints
app.post('/api/support/tickets', (req, res) => {
  res.json({
    success: true,
    data: {
      id: Date.now(),
      ticketNumber: `TKT-${Date.now()}`,
      ...req.body,
      status: 'open',
      createdAt: new Date()
    }
  });
});

app.get('/api/support/chat/:ticketId', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        message: 'Welcome! How can we help you today?',
        type: 'support',
        sender: 'Support Agent',
        created_at: new Date(Date.now() - 10000)
      }
    ]
  });
});

app.post('/api/support/chat', (req, res) => {
  res.json({
    success: true,
    data: {
      id: Date.now(),
      ...req.body,
      created_at: new Date()
    }
  });
});

// Socket.io for real-time chat
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('chat-message', (data) => {
    // Echo message to all clients in room
    io.to(data.roomId).emit('new-message', {
      id: Date.now(),
      message: data.message,
      sender: data.sender,
      timestamp: new Date(),
      type: data.type || 'user'
    });

    // Send auto-reply after 2 seconds
    setTimeout(() => {
      io.to(data.roomId).emit('new-message', {
        id: Date.now() + 1,
        message: 'Thank you for your message. A support agent will assist you shortly.',
        sender: 'Support Bot',
        timestamp: new Date(),
        type: 'support'
      });
    }, 2000);
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

// 404 handler
app.get('*', (req, res) => {
  const notFoundPath = path.join(__dirname, 'pvt-404-page.html');
  res.sendFile(notFoundPath);
});

// Start server
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 PVT Support Server running on port ${PORT}`);
  console.log(`🌐 Access the application at: http://localhost:${PORT}`);
  console.log(`💡 This is running in demo mode with mock data`);
});

module.exports = { app, io };