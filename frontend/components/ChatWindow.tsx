"use client";

import { useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/context/SocketContext";
import UserAvatar from "./UserAvatar";
import { HiChatBubbleOvalLeftEllipsis, HiArrowPath } from "react-icons/hi2";
import { IoCheckmark, IoCheckmarkDone } from "react-icons/io5";

export default function ChatWindow() {
  const {
    messages,
    username,
    currentChat,
    typingUser,
    allUsers,
    isChatLoading,
    reloadChat,
  } = useSocket();
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

        <div className="chat-header-actions">
          <motion.button
            type="button"
            className={`chat-reload-btn ${isChatLoading ? "loading" : ""}`}
            onClick={reloadChat}
            title="Reload conversation"
            disabled={isChatLoading}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <HiArrowPath size={18} className={isChatLoading ? "spin" : ""} />
          </motion.button>
        </div>
      </div>

      <div className="chat-messages">
        {isChatLoading ? (
          <div className="chat-reloader-container">
            <div className="chat-reloader-pill">
              <span className="reloader-spinner" />
              <span>Loading messages...</span>
            </div>
            <div className="skeleton-chat">
              <div className="skeleton-row received">
                <div className="skeleton-avatar" />
                <div className="skeleton-bubble w-60" />
              </div>
              <div className="skeleton-row sent">
                <div className="skeleton-bubble w-40" />
              </div>
              <div className="skeleton-row received">
                <div className="skeleton-avatar" />
                <div className="skeleton-bubble w-75" />
              </div>
              <div className="skeleton-row sent">
                <div className="skeleton-bubble w-50" />
              </div>
            </div>
          </div>
        ) : (
          <>
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
                      <div className="message-meta">
                        <span className="message-time">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isMine && (
                          <span className={`message-status-tick ${msg.status || "sent"}`}>
                            {(!msg.status || msg.status === "sent") && (
                              <IoCheckmark size={15} className="tick-sent" title="Sent" />
                            )}
                            {msg.status === "delivered" && (
                              <IoCheckmarkDone size={16} className="tick-delivered" title="Delivered" />
                            )}
                            {msg.status === "seen" && (
                              <IoCheckmarkDone size={16} className="tick-seen" title="Seen" />
                            )}
                          </span>
                        )}
                      </div>
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
          </>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
