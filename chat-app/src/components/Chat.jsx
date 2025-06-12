import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { user, logout, getToken } = useAuth();

  useEffect(() => {
    // Initialize socket connection with authentication
    const token = getToken();
    const newSocket = io("http://localhost:3000", {
      auth: {
        token: token,
      },
    });

    setSocket(newSocket);

    // Socket event listeners
    newSocket.on("message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on("previous-messages", (previousMessages) => {
      setMessages(previousMessages);
    });

    newSocket.on("user-joined", (data) => {
      console.log(`${data.username} joined the chat`);
    });

    newSocket.on("user-left", (data) => {
      console.log(`${data.username} left the chat`);
    });

    newSocket.on("user-typing", (data) => {
      setTypingUsers((prev) => {
        if (!prev.includes(data.username) && data.username !== user.username) {
          return [...prev, data.username];
        }
        return prev;
      });
    });

    newSocket.on("user-stopped-typing", (data) => {
      setTypingUsers((prev) => prev.filter((user) => user !== data.username));
    });

    newSocket.on("error", (error) => {
      console.error("Socket error:", error.message);
      if (error.message === "Authentication failed") {
        logout();
      }
    });

    // Join chat with authenticated user
    newSocket.emit("user-join", user.username);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [user, getToken, logout]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    if (!socket) return;

    // Handle typing indicator
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { username: user.username });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("stop-typing", { username: user.username });
    }, 2000);
  };

  const handleSendMessage = () => {
    if (messageInput.trim() !== "" && socket) {
      // Stop typing when message is sent
      if (isTyping) {
        setIsTyping(false);
        socket.emit("stop-typing", { username: user.username });
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }

      socket.emit("message", {
        message: messageInput,
        username: user.username,
        timestamp: new Date().toISOString(),
      });
      setMessageInput("");
    }
  };

  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
    }
    logout();
  };

  const getUserColor = (username) => {
    const colors = [
      "#007bff",
      "#28a745",
      "#dc3545",
      "#fd7e14",
      "#6f42c1",
      "#20c997",
      "#e83e8c",
      "#6c757d",
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const TypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    const typingText =
      typingUsers.length === 1
        ? `${typingUsers[0]} is typing...`
        : typingUsers.length === 2
        ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
        : `${typingUsers[0]} and ${
            typingUsers.length - 1
          } others are typing...`;

    return (
      <div
        style={{
          padding: "8px 15px",
          fontSize: "12px",
          color: "#666",
          fontStyle: "italic",
          borderTop: "1px solid #eee",
          backgroundColor: "#f8f9fa",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {typingText}
          <div
            style={{
              display: "inline-flex",
              gap: "2px",
            }}
          >
            {[1, 2, 3].map((dot) => (
              <div
                key={dot}
                style={{
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  backgroundColor: "#666",
                  animation: `typing-dot 1.4s infinite ease-in-out both`,
                  animationDelay: `${(dot - 1) * 0.16}s`,
                }}
              />
            ))}
          </div>
        </span>
        <style>
          {`
            @keyframes typing-dot {
              0%, 80%, 100% {
                transform: scale(0.8);
                opacity: 0.5;
              }
              40% {
                transform: scale(1);
                opacity: 1;
              }
            }
          `}
        </style>
      </div>
    );
  };

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          padding: "15px 20px",
          backgroundColor: "#007bff",
          borderRadius: "10px",
          color: "white",
        }}
      >
        <div>
          <h1 style={{ margin: "0", fontSize: "1.5rem" }}>Chat App</h1>
          <p style={{ margin: "0", fontSize: "0.9rem", opacity: "0.9" }}>
            Welcome, {user.username}!
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            color: "white",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: "bold",
            transition: "all 0.3s",
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
          }}
        >
          Logout
        </button>
      </div>

      {/* Messages Container */}
      <div
        style={{
          height: "400px",
          overflowY: "auto",
          border: "1px solid #ddd",
          borderRadius: "8px 8px 0 0",
          padding: "15px",
          marginBottom: "0",
          backgroundColor: "#f9f9f9",
        }}
      >
        {messages.map((message, index) => {
          const isMyMessage = message.username === user.username;
          const userColor = getUserColor(message.username || "Anonymous");

          return (
            <div
              key={index}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isMyMessage ? "flex-end" : "flex-start",
                marginBottom: "15px",
              }}
            >
              {/* Username and time label */}
              <div
                style={{
                  fontSize: "12px",
                  color: "#666",
                  marginBottom: "2px",
                  paddingLeft: isMyMessage ? "0" : "15px",
                  paddingRight: isMyMessage ? "15px" : "0",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>{message.username || "Anonymous"}</span>
                <span
                  style={{
                    fontSize: "10px",
                    color: "#999",
                    fontWeight: "normal",
                  }}
                >
                  {message.timestamp
                    ? formatTime(message.timestamp)
                    : formatTime(new Date())}
                </span>
              </div>

              {/* Message bubble */}
              <div
                style={{
                  backgroundColor: isMyMessage ? "#007bff" : userColor,
                  color: "white",
                  padding: "10px 15px",
                  borderRadius: "18px",
                  maxWidth: "70%",
                  wordWrap: "break-word",
                  fontSize: "14px",
                }}
              >
                {message.message}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <TypingIndicator />

      {/* Input Container */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          borderTop: typingUsers.length > 0 ? "none" : "1px solid #ddd",
          padding: "15px",
          backgroundColor: "white",
          borderRadius: typingUsers.length > 0 ? "0 0 8px 8px" : "0 0 8px 8px",
          border: "1px solid #ddd",
        }}
      >
        <input
          type="text"
          placeholder="Type your message..."
          value={messageInput}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          style={{
            flex: 1,
            padding: "12px",
            border: "1px solid #ddd",
            borderRadius: "20px",
            outline: "none",
            fontSize: "16px",
          }}
        />
        <button
          onClick={handleSendMessage}
          style={{
            padding: "12px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "20px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
