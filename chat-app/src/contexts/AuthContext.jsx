import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app load
    const token = localStorage.getItem("chatToken");
    const userData = localStorage.getItem("chatUser");

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("chatToken");
        localStorage.removeItem("chatUser");
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("chatToken", data.token);
        localStorage.setItem("chatUser", JSON.stringify(data.user));
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.message };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Login failed. Please try again." };
    }
  };

  const register = async (username, password) => {
    try {
      const response = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("chatToken", data.token);
        localStorage.setItem("chatUser", JSON.stringify(data.user));
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.message };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: "Registration failed. Please try again.",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("chatToken");
    localStorage.removeItem("chatUser");
    setUser(null);
  };

  const getToken = () => {
    return localStorage.getItem("chatToken");
  };

  const value = {
    user,
    login,
    register,
    logout,
    getToken,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
