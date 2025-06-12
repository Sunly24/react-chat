import React from "react";
import { useAuth } from "../contexts/AuthContext";
import Login from "./Login";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
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
            textAlign: "center",
            color: "#666",
          }}
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #007bff",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1rem",
            }}
          ></div>
          <p>Loading...</p>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  return user ? children : <Login />;
};

export default ProtectedRoute;
