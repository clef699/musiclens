import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import useAuthStore from "./store/authStore";

import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import UploadPage from "./pages/UploadPage";
import ResultsPage from "./pages/ResultsPage";
import HistoryPage from "./pages/HistoryPage";
import Navbar from "./components/Navbar";

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#1f2937", color: "#f9fafb", border: "1px solid #374151" },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={<PublicRoute><AuthPage mode="login" /></PublicRoute>}
        />
        <Route
          path="/register"
          element={<PublicRoute><AuthPage mode="register" /></PublicRoute>}
        />
        <Route
          path="/dashboard"
          element={<PrivateRoute><><Navbar /><DashboardPage /></></PrivateRoute>}
        />
        <Route
          path="/upload"
          element={<PrivateRoute><><Navbar /><UploadPage /></></PrivateRoute>}
        />
        <Route
          path="/results/:resultId"
          element={<PrivateRoute><><Navbar /><ResultsPage /></></PrivateRoute>}
        />
        <Route
          path="/history"
          element={<PrivateRoute><><Navbar /><HistoryPage /></></PrivateRoute>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
