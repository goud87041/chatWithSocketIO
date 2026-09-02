"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useSocket } from "@/context/SocketContext";
import { HiPaperAirplane } from "react-icons/hi2";

export default function MessageInput() {
  const { sendMessage, currentChat } = useSocket();
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!currentChat || !text.trim()) return;
    sendMessage(currentChat, text);
    setText("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const disabled = !currentChat;

  return (
    <div className={`message-input-bar ${disabled ? "disabled" : ""}`}>
      <motion.input
        ref={inputRef}
        type="text"
        placeholder={disabled ? "Select a user to start chatting..." : "Type a message..."}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="message-input"
        whileFocus={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300 }}
      />
      <motion.button
        className="send-button"
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <HiPaperAirplane size={20} />
      </motion.button>
    </div>
  );
}
