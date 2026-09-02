"use client";

import { motion } from "framer-motion";

interface UserAvatarProps {
  username: string;
  size?: "sm" | "md" | "lg";
  showStatus?: boolean;
  isOnline?: boolean;
}

const GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
];

function getGradient(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

const sizes = {
  sm: { container: 32, font: 14 },
  md: { container: 40, font: 16 },
  lg: { container: 56, font: 22 },
};

export default function UserAvatar({
  username,
  size = "md",
  showStatus = false,
  isOnline = false,
}: UserAvatarProps) {
  const s = sizes[size];
  const letter = username.charAt(0).toUpperCase();

  return (
    <motion.div
      className="user-avatar"
      style={{
        width: s.container,
        height: s.container,
        background: getGradient(username),
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        flexShrink: 0,
      }}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <span
        style={{
          color: "#fff",
          fontSize: s.font,
          fontWeight: 700,
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        {letter}
      </span>

      {showStatus && (
        <span
          className={`status-dot ${isOnline ? "online" : "offline"}`}
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: size === "sm" ? 8 : 12,
            height: size === "sm" ? 8 : 12,
            borderRadius: "50%",
            border: "2px solid var(--bg-primary)",
          }}
        />
      )}
    </motion.div>
  );
}
