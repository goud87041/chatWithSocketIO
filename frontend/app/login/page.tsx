"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSocket } from "@/context/SocketContext";
import {
  HiChatBubbleLeftRight,
  HiUser,
  HiLockClosed,
  HiEye,
  HiEyeSlash,
  HiArrowLeft,
} from "react-icons/hi2";

export default function LoginPage() {
  const [username, setUsernameInput] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUsername } = useSocket();
  const router = useRouter();

  const handleLogin = async () => {
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }

    setLoading(true);
    setError("");

    // Simulate auth check — replace with real API call to backend
    await new Promise((r) => setTimeout(r, 600));

    // For now, accept any valid credentials and connect via socket
    setUsername(username.trim());
    router.push("/chat");
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="landing-page">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <motion.button
          className="back-button"
          onClick={() => router.push("/")}
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
        >
          <HiArrowLeft size={18} />
          <span>Back</span>
        </motion.button>

        <motion.div
          className="landing-icon"
          initial={{ rotate: -15, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 15, delay: 0.1 }}
        >
          <HiChatBubbleLeftRight size={34} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Welcome Back
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Login to continue chatting
        </motion.p>

        <motion.div
          className="auth-form"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="input-group">
            <div className="input-icon">
              <HiUser size={18} />
            </div>
            <input
              id="login-username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => {
                setUsernameInput(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              autoFocus
              maxLength={20}
              className="input-with-icon"
            />
          </div>

          <div className="input-group">
            <div className="input-icon">
              <HiLockClosed size={18} />
            </div>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              maxLength={50}
              className="input-with-icon"
            />
            <button
              type="button"
              className="input-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <HiEyeSlash size={18} /> : <HiEye size={18} />}
            </button>
          </div>

          <div className="landing-error">{error}</div>

          <motion.button
            className="btn-primary"
            onClick={handleLogin}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" />
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </motion.button>
        </motion.div>

        <motion.p
          className="auth-switch"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Don&apos;t have an account?{" "}
          <button className="link-button" onClick={() => router.push("/register")}>
            Create one
          </button>
        </motion.p>
      </motion.div>
    </div>
  );
}
