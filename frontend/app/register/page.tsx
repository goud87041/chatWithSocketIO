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
  HiShieldCheck,
} from "react-icons/hi2";

export default function RegisterPage() {
  const [username, setUsernameInput] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUsername } = useSocket();
  const router = useRouter();

  const validate = (): string | null => {
    const trimmed = username.trim();

    if (!trimmed) return "Username is required";
    if (trimmed.length < 3) return "Username must be at least 3 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed))
      return "Username can only contain letters, numbers, and underscores";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (password !== confirmPassword) return "Passwords do not match";

    return null;
  };

  const handleRegister = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    // Simulate registration — replace with real API call to backend
    await new Promise((r) => setTimeout(r, 800));

    // On success, connect via socket and redirect to chat
    setUsername(username.trim());
    router.push("/chat");
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRegister();
  };

  // Password strength indicator
  const getPasswordStrength = (): { label: string; color: string; width: string } => {
    if (!password) return { label: "", color: "", width: "0%" };
    if (password.length < 6) return { label: "Weak", color: "var(--danger)", width: "25%" };
    if (password.length < 8)
      return { label: "Fair", color: "var(--warning)", width: "50%" };
    if (/(?=.*[A-Z])(?=.*[0-9])/.test(password))
      return { label: "Strong", color: "var(--success)", width: "100%" };
    return { label: "Good", color: "var(--accent-light)", width: "75%" };
  };

  const strength = getPasswordStrength();

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
          Create Account
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Sign up to start chatting instantly
        </motion.p>

        <motion.div
          className="auth-form"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Username */}
          <div className="input-group">
            <div className="input-icon">
              <HiUser size={18} />
            </div>
            <input
              id="register-username"
              type="text"
              placeholder="Choose a username"
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

          {/* Password */}
          <div className="input-group">
            <div className="input-icon">
              <HiLockClosed size={18} />
            </div>
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
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

          {/* Password strength bar */}
          {password && (
            <motion.div
              className="password-strength"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="strength-bar-track">
                <motion.div
                  className="strength-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: strength.width }}
                  style={{ backgroundColor: strength.color }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
              </div>
              <span className="strength-label" style={{ color: strength.color }}>
                {strength.label}
              </span>
            </motion.div>
          )}

          {/* Confirm Password */}
          <div className="input-group">
            <div className="input-icon">
              <HiShieldCheck size={18} />
            </div>
            <input
              id="register-confirm"
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              maxLength={50}
              className="input-with-icon"
            />
            <button
              type="button"
              className="input-toggle"
              onClick={() => setShowConfirm(!showConfirm)}
              tabIndex={-1}
            >
              {showConfirm ? <HiEyeSlash size={18} /> : <HiEye size={18} />}
            </button>
          </div>

          <div className="landing-error">{error}</div>

          <motion.button
            className="btn-primary"
            onClick={handleRegister}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" />
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </motion.button>
        </motion.div>

        <motion.p
          className="auth-switch"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Already have an account?{" "}
          <button className="link-button" onClick={() => router.push("/login")}>
            Login
          </button>
        </motion.p>
      </motion.div>
    </div>
  );
}
