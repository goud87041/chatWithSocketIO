"use client";

import { useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/context/SocketContext";
import UserAvatar from "./UserAvatar";
import { HiChatBubbleOvalLeftEllipsis } from "react-icons/hi2";

export default function ChatWindow() {
  const { messages, username, currentChat, typingUser, allUsers } = useSocket();
  const bottomRef = useRef<HTMLDivElement>(null);

  const currentChatUser = allUsers.find((u) => u.username === currentChat);
  const isCurrentChatOnline = currentChatUser ? currentChatUser.isOnline : false;

  const filteredMessages = useMemo(() => {
    if (!currentChat) return [];
    return messages.filter(
      (m) =>
        (m.from === username && m.to === currentChat) ||
        (m.from === currentChat && m.to === username)
    );
  }, [messages, username, currentChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filteredMessages]);

  if (!currentChat) {
    return (
      <div className="chat-window-empty">
        <motion.div
          className="empty-state"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          >
            <HiChatBubbleOvalLeftEllipsis size={72} className="empty-icon" />
          </motion.div>
          <h3>Select a conversation</h3>
          <p>Pick a user from the sidebar to start chatting</p>
        </motion.div>
      </div>
    );
  }

  const isPartnerTyping = typingUser === currentChat;

  return (
    <div className="chat-window">
      <div className="chat-header">
        <UserAvatar
          username={currentChat}
          size="md"
          showStatus
          isOnline={isCurrentChatOnline}
        />
        <div className="chat-header-info">
          <h3>{currentChat}</h3>
          <span
            className={`chat-header-status ${
              isPartnerTyping ? "typing" : isCurrentChatOnline ? "online" : "offline"
            }`}
          >
            {isPartnerTyping
              ? "Typing..."
              : isCurrentChatOnline
              ? "Online"
              : "Offline"}
          </span>
        </div>
      </div>

      <div className="chat-messages">
        <AnimatePresence initial={false}>
          {filteredMessages.map((msg) => {
            const isMine = msg.from === username;
            return (
              <motion.div
                key={msg.id || `${msg.from}-${msg.timestamp}`}
                className={`message-row ${isMine ? "sent" : "received"}`}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                {!isMine && (
                  <UserAvatar username={msg.from} size="sm" />
                )}
                <div className={`message-bubble ${isMine ? "mine" : "theirs"}`}>
                  <p>{msg.content}</p>
                  <span className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        {isPartnerTyping && (
          <motion.div
            className="typing-indicator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <UserAvatar username={currentChat} size="sm" />
            <div className="typing-dots">
              <span />
              <span />
              <span />
            </div>
          </motion.div>
        )}

        {filteredMessages.length === 0 && !isPartnerTyping && (
          <motion.div
            className="chat-no-messages"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p>No messages yet. Say hello! 👋</p>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
