require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const fs = require('fs');
const path = require('path');

const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');

const app = express();
const server = http.createServer(app);

// ========== CRITICAL CONFIGURATION ========== //
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Required for Render

// Process environment variables
const FRONTEND_URL = (process.env.FRONTEND_URL || "https://google-docs-clone-ochre-two.vercel.app").replace(/\/$/, "");
const allowedOrigins = [
  FRONTEND_URL,
  "http://localhost:3000"  // Development environment
];

// ========== STARTUP LOGS ========== //
console.log('🚀 Starting server with configuration:');
console.log('📍 PORT:', PORT);
console.log('🌐 HOST:', HOST);
console.log('🔗 FRONTEND_URL:', FRONTEND_URL);
console.log('✅ Allowed Origins:', allowedOrigins);
console.log('🗄️ MONGO_URI:', process.env.MONGO_URI ? '***masked***' : 'not set');
console.log('🔒 JWT_SECRET:', process.env.JWT_SECRET ? '***masked***' : 'not set');

// ========== FILE UPLOAD SETUP ========== //
const UPLOAD_DIR = 'uploads';
const AVATAR_DIR = path.join(UPLOAD_DIR, 'avatars');

// Ensure both directories exist
[UPLOAD_DIR, AVATAR_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📂 Created directory: ${path.resolve(dir)}`);
  }
});

// ========== STATIC FILE SERVING ========== //
const staticOptions = {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath);
    if (ext === '.png') {
      res.setHeader('Content-Type', 'image/png');
    } else if (ext === '.jpg' || ext === '.jpeg') {
      res.setHeader('Content-Type', 'image/jpeg');
    }
    res.setHeader('Cache-Control', 'public, max-age=86400');
  }
};

app.use('/uploads', express.static(path.resolve(UPLOAD_DIR), staticOptions));

// ========== MIDDLEWARE SETUP ========== //
// Enhanced CORS handling
app.use(cors({
  origin: function (origin, callback) {
    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Production: check allowed origins
    const allowedOrigins = [
      "https://google-docs-clone-ochre-two.vercel.app",
      "https://google-docs-clone-mu-henna.vercel.app"
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  exposedHeaders: ['Content-Disposition']
}));

// Body parsing with increased limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ========== ROUTES ========== //
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use("/uploads", express.static("uploads"));

// ========== HEALTH ENDPOINTS ========== //
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date(),
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    version: '1.0.0'
  });
});

app.get('/', (req, res) => res.send('Google Docs MVP API'));

// ========== SOCKET.IO SETUP ========== //
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
    transports: ['websocket', 'polling']
  },
  allowEIO3: true // For older clients
});

const documentRooms = new Map();

function getOrCreateRoom(documentId) {
  if (!documentRooms.has(documentId)) {
    documentRooms.set(documentId, {
      users: new Map(),
      content: ''
    });
  }
  return documentRooms.get(documentId);
}

// Socket.IO authentication
io.use((socket, next) => {
  try {
    let token = socket.handshake.auth.token;
    
    if (!token && socket.handshake.headers.cookie) {
      const cookies = cookie.parse(socket.handshake.headers.cookie);
      token = cookies.token;
    }

    if (!token) {
      console.warn('🔐 Authentication failed: No token provided');
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    console.error('❌ JWT verification error:', err.message);
    return next(new Error('Authentication error'));
  }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('🟢 New client connected:', socket.userId);
  
  socket.on('error', (error) => {
    console.error('🔌 Socket error:', error);
  });

  socket.on('join-document', async (documentId) => {
    try {
      const User = require('./models/User');
      const user = await User.findById(socket.userId).select('name avatar');
      
      if (!user) {
        console.warn(`👤 User not found: ${socket.userId}`);
        return;
      }
      
      socket.join(documentId);
      const room = getOrCreateRoom(documentId);
      
      room.users.set(socket.id, {
        id: socket.userId,
        name: user.name,
        avatar: user.avatar
      });
      
      socket.to(documentId).emit('user-joined', {
        id: socket.userId,
        name: user.name,
        avatar: user.avatar
      });
      
      const users = Array.from(room.users.values());
      socket.emit('current-users', users);
      
      if (room.content) {
        socket.emit('document-update', room.content);
      }
    } catch (err) {
      console.error('❌ Error joining document:', err);
    }
  });
  
  socket.on('document-change', (data) => {
    const { documentId, content } = data;
    
    if (!documentRooms.has(documentId)) {
      console.warn(`📄 Document room not found: ${documentId}`);
      return;
    }
    
    const room = documentRooms.get(documentId);
    room.content = content;
    socket.to(documentId).emit('document-update', content);
  });
  
  socket.on('leave-document', (documentId) => {
    socket.leave(documentId);
    
    if (documentRooms.has(documentId)) {
      const room = documentRooms.get(documentId);
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        socket.to(documentId).emit('user-left', socket.userId);
        
        if (room.users.size === 0) {
          documentRooms.delete(documentId);
          console.log(`🧹 Room ${documentId} cleaned up`);
        }
      }
    }
  });
  
  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.userId);
    
    documentRooms.forEach((room, documentId) => {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        socket.to(documentId).emit('user-left', socket.userId);
        
        if (room.users.size === 0) {
          documentRooms.delete(documentId);
          console.log(`🧹 Room ${documentId} cleaned up after disconnect`);
        }
      }
    });
  });
});

// ========== DATABASE & SERVER STARTUP ========== //
console.log('🔌 Connecting to MongoDB...');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
});

mongoose.connection.on('error', err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
  
  server.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`🔌 Socket.IO connected to origins:`, allowedOrigins);
  });
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

// ========== GRACEFUL SHUTDOWN ========== //
process.on('SIGINT', () => {
  console.log('🛑 Shutting down server');
  server.close(() => {
    mongoose.disconnect();
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err);
  process.exit(1);
});