"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSocket } from "@/context/SocketContext";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import MessageInput from "@/components/MessageInput";

export default function ChatPage() {
  const { username, isLoading } = useSocket();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !username) {
      router.replace("/");
    }
  }, [username, isLoading, router]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <span className="spinner" />
          <p>Restoring session...</p>
        </div>
      </div>
    );
  }

  if (!username) return null;

  return (
    <motion.div
      className="chat-layout"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Sidebar />
      <div className="chat-panel">
        <ChatWindow />
        <MessageInput />
      </div>
    </motion.div>
  );
}
