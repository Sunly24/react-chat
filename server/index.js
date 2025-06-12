import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here-change-in-production';

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Message Schema
const messageSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  room: {
    type: String,
    default: 'general'
  }
});

const Message = mongoose.model('Message', messageSchema);

// User Schema (for authentication and online users tracking)
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  socketId: {
    type: String,
    default: null
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Connect to MongoDB
connectDB();

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Socket.io authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication failed'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};

io.use(authenticateSocket);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ message: 'Username must be between 3 and 20 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create new user
    const user = new User({
      username: username.toLowerCase(),
      password
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

app.get('/api/auth/verify', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// API Routes
app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 }).limit(50);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({ isOnline: true }).select('username lastSeen isOnline');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

io.on("connection", async (socket) => {
  console.log("Authenticated user connected:", socket.user.username);

  // Update user's online status
  try {
    await User.findByIdAndUpdate(socket.user._id, {
      socketId: socket.id,
      isOnline: true,
      lastSeen: new Date()
    });

    socket.username = socket.user.username;

    // Send recent messages to new user
    const recentMessages = await Message.find().sort({ timestamp: 1 }).limit(20);
    socket.emit('previous-messages', recentMessages);

    console.log(`${socket.user.username} joined the chat`);
    
    // Broadcast user joined
    socket.broadcast.emit('user-joined', { 
      username: socket.user.username, 
      timestamp: new Date() 
    });
    
    // Send current online users
    const onlineUsers = await User.find({ isOnline: true }).select('username lastSeen isOnline');
    io.emit('users-update', onlineUsers);
  } catch (error) {
    console.error('Error handling authenticated connection:', error);
    socket.emit('error', { message: 'Connection error' });
  }

  socket.on('user-join', async (username) => {
    // This is now handled automatically during connection since user is authenticated
    console.log(`User ${socket.user.username} already authenticated and joined`);
  });

  socket.on("message", async (messageData) => {
    try {
      // Use authenticated user's username
      const newMessage = new Message({
        username: socket.user.username,
        message: messageData.message,
        timestamp: messageData.timestamp || new Date(),
        room: messageData.room || 'general'
      });

      await newMessage.save();

      // Broadcast message to all connected clients
      io.emit("message", newMessage);
      
      console.log(`Message saved: ${socket.user.username}: ${messageData.message}`);
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  
  // Typing indicators
  socket.on('typing', (data) => {
    socket.broadcast.emit('user-typing', { username: socket.user.username });
  });

  socket.on('stop-typing', (data) => {
    socket.broadcast.emit('user-stopped-typing', { username: socket.user.username });
  });

  socket.on("disconnect", async () => {
    try {
      // Update user's offline status
      await User.findByIdAndUpdate(socket.user._id, {
        isOnline: false,
        lastSeen: new Date(),
        socketId: null
      });
      
      console.log(`${socket.user.username} disconnected`);
      socket.broadcast.emit('user-left', { 
        username: socket.user.username, 
        timestamp: new Date() 
      });
      
      // Send updated users list
      const onlineUsers = await User.find({ isOnline: true }).select('username lastSeen isOnline');
      socket.broadcast.emit('users-update', onlineUsers);
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
  
});