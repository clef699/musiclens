import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Music, Eye, EyeOff } from "lucide-react";
import { authAPI } from "../utils/api";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

export default function AuthPage({ mode = "login" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const isLogin = mode === "login";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const res = await authAPI.login(email, password);
        login(res.data.access_token, { id: res.data.user_id, email: res.data.email });
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else {
        await authAPI.register(email, password);
        const res = await authAPI.login(email, password);
        login(res.data.access_token, { id: res.data.user_id, email: res.data.email });
        toast.success("Account created! Welcome to MusicLens.");
        navigate("/dashboard");
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Something went wrong. Please try again.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl mb-8">
        <Music className="w-6 h-6 text-primary-500" />
        MusicLens
      </Link>

      <div className="w-full max-w-md card">
        <h1 className="text-2xl font-bold text-white mb-1">
          {isLogin ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          {isLogin ? "Sign in to access your analyses." : "Start analysing your music for free."}
        </p>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="input-field pr-11"
                placeholder={isLogin ? "••••••••" : "At least 8 characters"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              <button
                type="button"
                className="absolute right-3 top-3.5 text-gray-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
            {loading ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <Link to={isLogin ? "/register" : "/login"} className="text-primary-400 hover:underline">
            {isLogin ? "Sign up free" : "Sign in"}
          </Link>
        </p>
      </div>
    </div>
  );
}
