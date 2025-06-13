import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]); // Add this state to track online users
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

    // Add listener for online users update
    newSocket.on("users-update", (users) => {
      setOnlineUsers(users);
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

  // Helper function to check if a user is online
  const isUserOnline = (username) => {
    return onlineUsers.some((u) => u.username === username);
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

  // Profile Circle component with online status
  const ProfileCircle = ({ username, showOnlineStatus = true }) => {
    const userColor = getUserColor(username);
    const online = isUserOnline(username);

    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        <div
          style={{
            width: "30px",
            height: "30px",
            backgroundColor: userColor,
            color: "white",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "14px",
          }}
        >
          {username.charAt(0).toUpperCase()}
        </div>
        {showOnlineStatus && (
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: online ? "#44b700" : "#bdbdbd",
              border: "2px solid white",
              position: "absolute",
              bottom: "-2px",
              right: "-2px",
            }}
          />
        )}
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ProfileCircle username={user.username} showOnlineStatus={true} />
            <p style={{ margin: "0", fontSize: "0.9rem", opacity: "0.9" }}>
              Welcome, {user.username}!
            </p>
          </div>
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
                marginBottom: "20px",
              }}
            >
              {/* Username label */}
              <div
                style={{
                  fontSize: "12px",
                  color: "#666",
                  marginBottom: "4px",
                  paddingLeft: isMyMessage ? "0" : "5px",
                  paddingRight: isMyMessage ? "5px" : "0",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {!isMyMessage && <span>{message.username || "Anonymous"}</span>}
                {isMyMessage && <span>{message.username || "Anonymous"}</span>}
              </div>

              {/* Message bubble with profile */}
              <div
                style={{
                  display: "flex",
                  flexDirection: isMyMessage ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  gap: "8px",
                  maxWidth: "85%",
                }}
              >
                <ProfileCircle username={message.username || "Anonymous"} />
                <div
                  style={{
                    backgroundColor: isMyMessage ? "#007bff" : userColor,
                    color: "white",
                    padding: "10px 15px",
                    borderRadius: isMyMessage
                      ? "18px 0px 18px 18px"
                      : "0px 18px 18px 18px",
                    wordWrap: "break-word",
                    fontSize: "14px",
                  }}
                >
                  {message.message}
                </div>
              </div>

              {/* Timestamp below message */}
              <div
                style={{
                  fontSize: "10px",
                  color: "#999",
                  marginTop: "4px",
                  alignSelf: isMyMessage ? "flex-end" : "flex-start",
                  paddingLeft: isMyMessage ? "0" : "40px", // Add padding to align with message
                  paddingRight: isMyMessage ? "40px" : "0", // Add padding to align with message
                }}
              >
                {message.timestamp
                  ? formatTime(message.timestamp)
                  : formatTime(new Date())}
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
