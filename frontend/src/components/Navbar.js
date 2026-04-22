import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Music, Upload, Clock, LayoutDashboard, LogOut } from "lucide-react";
import useAuthStore from "../store/authStore";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2 text-white font-bold text-xl">
            <Music className="w-6 h-6 text-primary-500" />
            MusicLens
          </Link>

          <div className="flex items-center gap-1">
            <NavLink to="/dashboard" icon={<LayoutDashboard size={16} />} label="Dashboard" active={isActive("/dashboard")} />
            <NavLink to="/upload" icon={<Upload size={16} />} label="Upload" active={isActive("/upload")} />
            <NavLink to="/history" icon={<Clock size={16} />} label="History" active={isActive("/history")} />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm hidden sm:block">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm py-1.5 px-3 rounded-lg hover:bg-gray-800"
            >
              <LogOut size={16} />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition-colors ${
        active ? "bg-primary-900 text-primary-400" : "text-gray-400 hover:text-white hover:bg-gray-800"
      }`}
    >
      {icon}
      <span className="hidden sm:block">{label}</span>
    </Link>
  );
}
