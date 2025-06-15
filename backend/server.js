require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const cookie = require('cookie'); // Added for cookie parsing

const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');

const app = express();
const server = http.createServer(app);

// Critical configuration
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Required for Render
const FRONTEND_URL = process.env.FRONTEND_URL || "https://google-docs-clone-mu-henna.vercel.app";

// Remove any trailing slash from frontend URL
const cleanFrontendUrl = FRONTEND_URL.endsWith('/') 
  ? FRONTEND_URL.slice(0, -1) 
  : FRONTEND_URL;

// Startup logs for debugging
console.log('Starting server with configuration:');
console.log('PORT:', PORT);
console.log('HOST:', HOST);
console.log('FRONTEND_URL:', cleanFrontendUrl);
console.log('MONGO_URI:', process.env.MONGO_URI ? '***masked***' : 'not set');

// Socket.IO configuration
const io = socketIo(server, {
  cors: {
    origin: cleanFrontendUrl,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// CORS Middleware
app.use(cors({ 
  origin: cleanFrontendUrl,
  credentials: true 
}));

// Other middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use("/uploads", express.static("uploads"));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date(),
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Home endpoint
app.get('/', (req, res) => res.send('Google Docs MVP API'));

// Socket.IO for real-time collaboration
const documentRooms = new Map();

// Document room management helper
function getOrCreateRoom(documentId) {
  if (!documentRooms.has(documentId)) {
    documentRooms.set(documentId, {
      users: new Map(),
      content: ''
    });
  }
  return documentRooms.get(documentId);
}

// Socket.IO authentication middleware
io.use((socket, next) => {
  try {
    // Extract token from handshake auth or cookies
    let token = socket.handshake.auth.token;
    
    if (!token && socket.handshake.headers.cookie) {
      const cookies = cookie.parse(socket.handshake.headers.cookie);
      token = cookies.token;
    }

    if (!token) {
      console.warn('Authentication failed: No token provided');
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    console.error('JWT verification error:', err.message);
    return next(new Error('Authentication error'));
  }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('New client connected:', socket.userId);
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Join document room
  socket.on('join-document', async (documentId) => {
    try {
      const User = require('./models/User');
      const user = await User.findById(socket.userId).select('name avatar');
      
      if (!user) {
        console.warn(`User not found: ${socket.userId}`);
        return;
      }
      
      socket.join(documentId);
      const room = getOrCreateRoom(documentId);
      
      // Add user to room
      room.users.set(socket.id, {
        id: socket.userId,
        name: user.name,
        avatar: user.avatar
      });
      
      // Notify others about new user
      socket.to(documentId).emit('user-joined', {
        id: socket.userId,
        name: user.name,
        avatar: user.avatar
      });
      
      // Send current users and content to new user
      const users = Array.from(room.users.values());
      socket.emit('current-users', users);
      
      if (room.content) {
        socket.emit('document-update', room.content);
      }
    } catch (err) {
      console.error('Error joining document:', err);
    }
  });
  
  // Handle document changes
  socket.on('document-change', (data) => {
    const { documentId, content } = data;
    
    if (!documentRooms.has(documentId)) {
      console.warn(`Document room not found: ${documentId}`);
      return;
    }
    
    const room = documentRooms.get(documentId);
    room.content = content;
    socket.to(documentId).emit('document-update', content);
  });
  
  // Handle user leaving
  socket.on('leave-document', (documentId) => {
    socket.leave(documentId);
    
    if (documentRooms.has(documentId)) {
      const room = documentRooms.get(documentId);
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        socket.to(documentId).emit('user-left', socket.userId);
        
        // Clean up room if empty
        if (room.users.size === 0) {
          documentRooms.delete(documentId);
          console.log(`Room ${documentId} cleaned up`);
        }
      }
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.userId);
    
    // Remove user from all rooms
    documentRooms.forEach((room, documentId) => {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        socket.to(documentId).emit('user-left', socket.userId);
        
        if (room.users.size === 0) {
          documentRooms.delete(documentId);
          console.log(`Room ${documentId} cleaned up after disconnect`);
        }
      }
    });
  });
});

// Database connection and server startup
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGO_URI);

mongoose.connection.on('error', err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
  
  server.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`🔌 Socket.IO connected to ${cleanFrontendUrl}`);
  });
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server');
  server.close(() => {
    mongoose.disconnect();
    console.log('Server stopped');
    process.exit(0);
  });
});