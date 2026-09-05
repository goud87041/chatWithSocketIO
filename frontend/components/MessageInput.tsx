"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useSocket } from "@/context/SocketContext";
import { HiPaperAirplane } from "react-icons/hi2";

export default function MessageInput() {
  const { sendMessage, currentChat, emitTyping, emitStopTyping } = useSocket();
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const handleSend = () => {
    if (!currentChat || !text.trim()) return;
    sendMessage(currentChat, text);
    setText("");
    inputRef.current?.focus();

    // Stop typing indicator on send
    if (isTypingRef.current) {
      emitStopTyping(currentChat);
      isTypingRef.current = false;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setText(e.target.value);

      if (!currentChat) return;

      // Emit typing indicator
      if (!isTypingRef.current) {
        emitTyping(currentChat);
        isTypingRef.current = true;
      }

      // Reset the stop-typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (currentChat && isTypingRef.current) {
          emitStopTyping(currentChat);
          isTypingRef.current = false;
        }
      }, 1500);
    },
    [currentChat, emitTyping, emitStopTyping]
  );

  // Clean up typing state when switching chats
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      isTypingRef.current = false;
    };
  }, [currentChat]);

  const disabled = !currentChat;

  return (
    <div className={`message-input-bar ${disabled ? "disabled" : ""}`}>
      <motion.input
        ref={inputRef}
        type="text"
        placeholder={disabled ? "Select a user to start chatting..." : "Type a message..."}
        value={text}
        onChange={handleChange}
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
