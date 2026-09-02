"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import type { Message, ChatPartner } from "@/types";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  username: string;
  setUsername: (name: string) => void;
  onlineUsers: ChatPartner[];
  messages: Message[];
  sendMessage: (to: string, content: string) => void;
  currentChat: string | null;
  setCurrentChat: (username: string | null) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  username: "",
  setUsername: () => {},
  onlineUsers: [],
  messages: [],
  sendMessage: () => {},
  currentChat: null,
  setCurrentChat: () => {},
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<ChatPartner[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!username) return;

    const newSocket = io(SOCKET_URL, {
      query: { username },
      transports: ["websocket", "polling"],
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("user-list", (users: ChatPartner[]) => {
      setOnlineUsers(users.filter((u) => u.username !== username));
    });

    newSocket.on("receive-message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on("message-sent", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [username]);

  const sendMessage = useCallback(
    (to: string, content: string) => {
      if (!socketRef.current || !content.trim()) return;

      const message: Message = {
        id: crypto.randomUUID(),
        from: username,
        to,
        content: content.trim(),
        timestamp: Date.now(),
      };

      socketRef.current.emit("send-message", message);
    },
    [username]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        username,
        setUsername,
        onlineUsers,
        messages,
        sendMessage,
        currentChat,
        setCurrentChat,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
