"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/context/SocketContext";
import UserAvatar from "./UserAvatar";
import { HiChatBubbleLeftRight } from "react-icons/hi2";

export default function Sidebar() {
  const { onlineUsers, currentChat, setCurrentChat, username } = useSocket();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <HiChatBubbleLeftRight size={22} />
          <h2>ChatPulse</h2>
        </div>
        <div className="sidebar-user">
          <UserAvatar username={username} size="sm" />
          <span className="sidebar-username">{username}</span>
        </div>
      </div>

      <div className="sidebar-section-title">
        <span>Online</span>
        <span className="online-count">{onlineUsers.length}</span>
      </div>

      <div className="sidebar-list">
        <AnimatePresence>
          {onlineUsers.length === 0 ? (
            <motion.div
              className="sidebar-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p>No one else is online yet.</p>
              <p className="sidebar-empty-hint">Share this app to start chatting!</p>
            </motion.div>
          ) : (
            onlineUsers.map((user, index) => (
              <motion.button
                key={user.username}
                className={`sidebar-item ${currentChat === user.username ? "active" : ""}`}
                onClick={() => setCurrentChat(user.username)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <UserAvatar
                  username={user.username}
                  size="md"
                  showStatus
                  isOnline
                />
                <div className="sidebar-item-info">
                  <span className="sidebar-item-name">{user.username}</span>
                  <span className="sidebar-item-status">Online</span>
                </div>
              </motion.button>
            ))
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
