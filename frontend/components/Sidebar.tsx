"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/SocketContext";
import UserAvatar from "./UserAvatar";
import { HiChatBubbleLeftRight, HiArrowRightOnRectangle } from "react-icons/hi2";

export default function Sidebar() {
  const {
    onlineUsers,
    offlineUsers,
    allUsers,
    currentChat,
    setCurrentChat,
    username,
    logout,
    isConnected,
  } = useSocket();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

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
          <span
            className={`connection-badge ${isConnected ? "connected" : "disconnected"}`}
          >
            {isConnected ? "Connected" : "Offline"}
          </span>
        </div>
      </div>

      <div className="sidebar-list">
        {allUsers.length === 0 ? (
          <div className="sidebar-empty">
            <p>No other users found.</p>
            <p className="sidebar-empty-hint">Create another account to start chatting!</p>
          </div>
        ) : (
          <>
            {/* Online Users Section */}
            {onlineUsers.length > 0 && (
              <div className="sidebar-group">
                <div className="sidebar-section-title">
                  <span>Online</span>
                  <span className="online-count">{onlineUsers.length}</span>
                </div>
                {onlineUsers.map((user, index) => (
                  <motion.button
                    key={user.username}
                    className={`sidebar-item ${currentChat === user.username ? "active" : ""}`}
                    onClick={() => setCurrentChat(user.username)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04, type: "spring", stiffness: 200 }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <UserAvatar
                      username={user.username}
                      size="md"
                      showStatus
                      isOnline={true}
                    />
                    <div className="sidebar-item-info">
                      <span className="sidebar-item-name">{user.username}</span>
                      <span className="sidebar-item-status online">Online</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Offline Users Section */}
            {offlineUsers.length > 0 && (
              <div className="sidebar-group">
                <div className="sidebar-section-title">
                  <span>Offline</span>
                  <span className="offline-count">{offlineUsers.length}</span>
                </div>
                {offlineUsers.map((user, index) => (
                  <motion.button
                    key={user.username}
                    className={`sidebar-item offline ${currentChat === user.username ? "active" : ""}`}
                    onClick={() => setCurrentChat(user.username)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04, type: "spring", stiffness: 200 }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <UserAvatar
                      username={user.username}
                      size="md"
                      showStatus
                      isOnline={false}
                    />
                    <div className="sidebar-item-info">
                      <span className="sidebar-item-name">{user.username}</span>
                      <span className="sidebar-item-status offline">Offline</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Logout Button */}
      <div className="sidebar-footer">
        <motion.button
          className="logout-button"
          onClick={handleLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <HiArrowRightOnRectangle size={18} />
          <span>Logout</span>
        </motion.button>
      </div>
    </aside>
  );
}
