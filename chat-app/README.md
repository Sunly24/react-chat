# Real-Time Chat Application

A full-stack real-time chat application built with React, Node.js, Socket.io, and MongoDB. Features user authentication, real-time messaging, typing indicators, and user presence tracking.

## 🚀 Features

- **Real-time messaging** with Socket.io
- **User authentication** (register/login with JWT)
- **Typing indicators** to show when users are typing
- **Message persistence** with MongoDB
- **Responsive design** with modern UI
- **Protected routes** with authentication

## 🛠 Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Socket.io Client** - Real-time communication
- **Context API** - State management for authentication

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.io** - Real-time communication
- **MongoDB & Mongoose** - Database and ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
react-chat/
├── chat-app/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.jsx      # Main chat interface
│   │   │   ├── Login.jsx     # Login/Register form
│   │   │   └── ProtectedRoute.jsx # Route protection
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx    # Authentication context
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── server/                   # Node.js backend
    ├── scripts/
    │   └── reset-db.js       # Database reset utility
    ├── index.js              # Main server file
    ├── package.json
    └── .env                  # Environment variables
```

## 🔧 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v6 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/)

## 📥 Installation & Setup

### Step 1: Clone the Repository (if needed)
```bash
# If you haven't cloned yet
git clone https://github.com/Sunly24/react-chat.git
cd react-chat
```

### Step 2: Install MongoDB
**For macOS (using Homebrew):**
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community
```

**For Windows:**
1. Download MongoDB Community Server from [MongoDB website](https://www.mongodb.com/try/download/community)
2. Install and follow the setup wizard
3. Start MongoDB service from Services or run `mongod`

### Step 3: Setup Backend Server

Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

Create and configure environment variables:
```bash
# The .env file already exists, but you can modify it if needed
cat .env
```

The `.env` file should contain:
```env
MONGODB_URI=mongodb://localhost:27017/chatapp
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
```

### Step 4: Setup Frontend Client

Navigate to the frontend directory and install dependencies:
```bash
cd ../chat-app
npm install
```

## 🚀 Running the Application

### Step 1: Start MongoDB
Make sure MongoDB is running on your system:

**macOS (with Homebrew):**
```bash
brew services start mongodb/brew/mongodb-community
```

**Windows/Linux:**
```bash
# Check if MongoDB is running
mongosh
# If it connects successfully, MongoDB is running
# If not, start the MongoDB service
```

### Step 2: Start the Backend Server

In the `server` directory:
```bash
cd server
npm run dev
```

You should see:
```
Server is running on port 3000
MongoDB connected successfully
```

The server will be running on `http://localhost:3000`

### Step 3: Start the Frontend Client

In a new terminal, navigate to the `chat-app` directory:
```bash
cd chat-app
npm run dev
```

You should see:
```
  VITE v6.3.5  ready in 200 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

The frontend will be running on `http://localhost:5173`

### Step 4: Open the Application

1. Open your web browser
2. Navigate to `http://localhost:5173`
3. You'll see the login/register page

## 👥 Using the Application

### Creating an Account
1. Click "Create an account" on the login page
2. Enter a username (3-20 characters) and password (6+ characters)
3. Click "Create Account"

### Logging In
1. Enter your username and password
2. Click "Sign In"

### Chatting
1. Once logged in, you'll see the chat interface
2. Type your message in the input field
3. Press Enter or click "Send" to send messages
4. You'll see typing indicators when other users are typing
5. All messages are saved and will persist across sessions

### Testing Real-time Features
1. Open multiple browser tabs/windows
2. Create different accounts or use the same account
3. Send messages and observe real-time updates
4. Notice typing indicators and user join/leave notifications

## 🔧 Available Scripts

### Backend (server directory)
```bash
npm run dev          # Start development server with nodemon
npm start           # Start production server
npm run reset-db    # Reset/clear the database
npm run fresh-db    # Reset database (alias)
npm run db:reset    # Reset database collections
npm run db:status   # Check database status
npm run db:users    # View all users
npm run db:messages # View all messages
```

### Frontend (chat-app directory)
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
npm run lint        # Run ESLint
```

## 🗄️ Database Management

### Reset Database
If you want to start fresh with an empty database:
```bash
cd server
npm run reset-db
```

### Check Database Status
```bash
cd server
npm run db:status
```

### View Users and Messages
```bash
# View all users
npm run db:users

# View all messages
npm run db:messages
```

## 🛡️ Security Features

- **Password Hashing**: Uses bcryptjs to hash passwords
- **JWT Authentication**: Secure token-based authentication
- **Protected Routes**: Frontend routes protected by authentication
- **Socket Authentication**: Socket connections require valid JWT tokens
- **Input Validation**: Server-side validation for user inputs
- **CORS Configuration**: Properly configured cross-origin requests

## 🐛 Troubleshooting

### Common Issues

**1. MongoDB Connection Error**
```
Error: MongoDB connection error
```
**Solution**: Make sure MongoDB is running on your system

**2. Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution**: Kill the process using port 3000 or change the port in `.env`

**3. Frontend Can't Connect to Backend**
**Solution**: Ensure both servers are running and check the URLs in the frontend code

**4. Authentication Issues**
**Solution**: Clear browser localStorage and try logging in again

### Debug Commands
```bash
# Check if MongoDB is running
mongosh

# Check what's running on port 3000
lsof -i :3000

# Check what's running on port 5173
lsof -i :5173

# View server logs
cd server
npm run dev

# View frontend logs
cd chat-app
npm run dev
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token

### Chat
- `GET /api/messages` - Get chat messages (authenticated)
- `GET /api/users` - Get online users (authenticated)

### Socket Events
- `message` - Send/receive chat messages
- `user-join` - User joined notification
- `user-left` - User left notification
- `typing` - User typing indicator
- `stop-typing` - Stop typing indicator
