import React from "react";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Chat from "./components/Chat";

const App = () => {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <Chat />
      </ProtectedRoute>
    </AuthProvider>
  );
};

export default App;
