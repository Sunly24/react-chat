import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

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

// User Schema (for online users tracking)
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  socketId: {
    type: String,
    required: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// API Routes
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 }).limit(50);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('username lastSeen');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

io.on("connection", async (socket) => {
  console.log("New user connected:", socket.id);

  // Send recent messages to new user
  try {
    const recentMessages = await Message.find().sort({ timestamp: 1 }).limit(20);
    socket.emit('previous-messages', recentMessages);
  } catch (error) {
    console.error('Error fetching recent messages:', error);
  }

  socket.on('user-join', async (username) => {
    try {
      // Update or create user
      await User.findOneAndUpdate(
        { username },
        { socketId: socket.id, lastSeen: new Date() },
        { upsert: true, new: true }
      );
      
      socket.username = username;
      console.log(`${username} joined the chat`);
      
      // Broadcast user joined
      socket.broadcast.emit('user-joined', { username, timestamp: new Date() });
      
      // Send current online users
      const onlineUsers = await User.find().select('username lastSeen');
      io.emit('users-update', onlineUsers);
    } catch (error) {
      console.error('Error handling user join:', error);
    }
  });

  socket.on("message", async (messageData) => {
    try {
      // Save message to database
      const newMessage = new Message({
        username: messageData.username,
        message: messageData.message,
        timestamp: messageData.timestamp || new Date(),
        room: messageData.room || 'general'
      });

      await newMessage.save();

      // Broadcast message to all connected clients
      io.emit("message", newMessage);
      
      console.log(`Message saved: ${messageData.username}: ${messageData.message}`);
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  
  // Typing indicators
  socket.on('typing', (data) => {
    socket.broadcast.emit('user-typing', data);
  });

  socket.on('stop-typing', (data) => {
    socket.broadcast.emit('user-stopped-typing', data);
  });

  socket.on("disconnect", async () => {
    try {
      if (socket.username) {
        // Update user's last seen
        await User.findOneAndUpdate(
          { username: socket.username },
          { lastSeen: new Date() }
        );
        
        console.log(`${socket.username} disconnected`);
        socket.broadcast.emit('user-left', { username: socket.username, timestamp: new Date() });
        
        // Send updated users list
        const onlineUsers = await User.find().select('username lastSeen');
        socket.broadcast.emit('users-update', onlineUsers);
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
  
});