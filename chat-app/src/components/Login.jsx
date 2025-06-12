import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    const result = isLoginMode
      ? await login(username, password)
      : await register(username, password);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError("");
    setUsername("");
    setPassword("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f0f2f5",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          width: "100%",
          maxWidth: "400px",
          border: "1px solid #e1e1e1",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h1
            style={{
              color: "#007bff",
              marginBottom: "0.5rem",
              fontSize: "1.8rem",
              fontWeight: "bold",
            }}
          >
            Chat App
          </h1>
          <h2
            style={{
              color: "#333",
              marginBottom: "0.5rem",
              fontSize: "1.2rem",
              fontWeight: "normal",
            }}
          >
            {isLoginMode ? "Welcome Back!" : "Create Account"}
          </h2>
          <p
            style={{
              color: "#666",
              fontSize: "0.9rem",
              margin: "0",
            }}
          >
            {isLoginMode
              ? "Sign in to continue chatting"
              : "Join the conversation today"}
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: "#f8d7da",
              color: "#721c24",
              padding: "0.75rem",
              borderRadius: "6px",
              border: "1px solid #f5c6cb",
              marginBottom: "1rem",
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "0.875rem",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "1rem",
                outline: "none",
                transition: "border-color 0.3s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#007bff")}
              onBlur={(e) => (e.target.style.borderColor = "#ddd")}
              required
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "0.875rem",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "1rem",
                outline: "none",
                transition: "border-color 0.3s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#007bff")}
              onBlur={(e) => (e.target.style.borderColor = "#ddd")}
              required
            />
            {!isLoginMode && (
              <small
                style={{
                  color: "#666",
                  fontSize: "0.8rem",
                  marginTop: "0.25rem",
                  display: "block",
                }}
              >
                Password must be at least 6 characters
              </small>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.875rem",
              backgroundColor: loading ? "#6c757d" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontWeight: "bold",
              transition: "background-color 0.3s",
              marginBottom: "1rem",
            }}
            onMouseOver={(e) => {
              if (!loading) e.target.style.backgroundColor = "#0056b3";
            }}
            onMouseOut={(e) => {
              if (!loading) e.target.style.backgroundColor = "#007bff";
            }}
          >
            {loading
              ? isLoginMode
                ? "Signing in..."
                : "Creating account..."
              : isLoginMode
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        <div
          style={{
            textAlign: "center",
            borderTop: "1px solid #eee",
            paddingTop: "1rem",
          }}
        >
          <p
            style={{
              color: "#666",
              fontSize: "0.9rem",
              margin: "0 0 0.5rem 0",
            }}
          >
            {isLoginMode
              ? "Don't have an account?"
              : "Already have an account?"}
          </p>
          <button
            type="button"
            onClick={toggleMode}
            style={{
              background: "none",
              border: "none",
              color: "#007bff",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: "bold",
              textDecoration: "underline",
            }}
            onMouseOver={(e) => (e.target.style.color = "#0056b3")}
            onMouseOut={(e) => (e.target.style.color = "#007bff")}
          >
            {isLoginMode ? "Create an account" : "Sign in instead"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
