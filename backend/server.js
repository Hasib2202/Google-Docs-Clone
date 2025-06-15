require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');

const app = express();
const server = http.createServer(app);

// Create Socket.IO server with CORS configuration
const io = socketIo(server, {
  cors: {
    //origin: process.env.FRONTEND_URL || "http://localhost:3000",
    origin: "https://google-docs-clone-mu-henna.vercel.app/", 
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({ 
  //origin: process.env.FRONTEND_URL || "http://localhost:3000", 
  origin: "https://google-docs-clone-mu-henna.vercel.app/",
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use("/uploads", express.static("uploads"));

app.get('/', (req, res) => res.send('API Running'));

// Socket.IO for real-time collaboration
const documentRooms = new Map(); // Store document rooms: roomId -> {users: Map<socket.id, user>, content: string}

// Socket.IO authentication middleware
io.use((socket, next) => {
  // Try to get token from cookies or handshake auth
  const token = socket.handshake.auth.token || 
               (socket.handshake.headers.cookie && 
                socket.handshake.headers.cookie.split('; ')
                .find(c => c.startsWith('token='))?.split('=')[1]);
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    return next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.userId);
  
  // Join document room
  socket.on('join-document', async (documentId) => {
    try {
      // Get user info from DB
      const User = require('./models/User');
      const user = await User.findById(socket.userId).select('name avatar');
      if (!user) return;
      
      // Join the room
      socket.join(documentId);
      
      // Initialize room if needed
      if (!documentRooms.has(documentId)) {
        documentRooms.set(documentId, {
          users: new Map(),
          content: ''
        });
      }
      
      const room = documentRooms.get(documentId);
      
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
      
      // Send current users to the new user
      const users = Array.from(room.users.values());
      socket.emit('current-users', users);
      
      // Send current content to the new user
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
    
    if (!documentRooms.has(documentId)) return;
    
    // Update room content
    const room = documentRooms.get(documentId);
    room.content = content;
    
    // Broadcast changes to others in the room
    socket.to(documentId).emit('document-update', content);
  });
  
  // Handle user leaving
  socket.on('leave-document', (documentId) => {
    socket.leave(documentId);
    
    if (documentRooms.has(documentId)) {
      const room = documentRooms.get(documentId);
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);
        
        // Notify others about user leaving
        socket.to(documentId).emit('user-left', socket.userId);
        
        // Clean up room if empty
        if (room.users.size === 0) {
          documentRooms.delete(documentId);
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
        
        // Clean up room if empty
        if (room.users.size === 0) {
          documentRooms.delete(documentId);
        }
      }
    });
  });
});

// Connect DB and Start Server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => console.error('DB Connection Error:', err));