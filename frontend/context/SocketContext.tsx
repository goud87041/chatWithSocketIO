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
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

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
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
  isLoading: boolean;
  typingUser: string | null;
  emitTyping: (to: string) => void;
  emitStopTyping: (to: string) => void;
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
  token: null,
  setToken: () => {},
  logout: () => {},
  isLoading: true,
  typingUser: null,
  emitTyping: () => {},
  emitStopTyping: () => {},
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<ChatPartner[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChat, setCurrentChatState] = useState<string | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Store token in state + localStorage
   */
  const setToken = useCallback((newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      localStorage.setItem("chatpulse_token", newToken);
    } else {
      localStorage.removeItem("chatpulse_token");
    }
  }, []);

  /**
   * Logout: clear everything and disconnect
   */
  const logout = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSocket(null);
    setIsConnected(false);
    setUsername("");
    setOnlineUsers([]);
    setMessages([]);
    setCurrentChatState(null);
    setToken(null);
    setTypingUser(null);
  }, [setToken]);

  /**
   * On mount: try to restore session from stored token
   */
  useEffect(() => {
    const storedToken = localStorage.getItem("chatpulse_token");
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    // Verify token with backend
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Token invalid");
        return res.json();
      })
      .then((data) => {
        setTokenState(storedToken);
        setUsername(data.user.username);
      })
      .catch(() => {
        localStorage.removeItem("chatpulse_token");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  /**
   * Connect to Socket.IO when username + token are available
   */
  useEffect(() => {
    if (!username || !token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
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

    // Typing events
    newSocket.on("user-typing", (data: { username: string }) => {
      setTypingUser(data.username);
    });

    newSocket.on("user-stopped-typing", () => {
      setTypingUser(null);
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [username, token]);

  /**
   * Fetch message history when currentChat changes
   */
  const setCurrentChat = useCallback(
    (partner: string | null) => {
      setCurrentChatState(partner);
      setTypingUser(null);

      if (!partner || !token) return;

      fetch(`${API_URL}/messages/${partner}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.messages && Array.isArray(data.messages)) {
            // Replace messages for this conversation with server history,
            // then merge any client-side messages not yet in the history
            setMessages((prev) => {
              const historyIds = new Set(
                data.messages.map((m: Message) => m._id || `${m.from}-${m.to}-${m.timestamp}`)
              );
              // Keep messages from other conversations + any not in history
              const otherMessages = prev.filter(
                (m) =>
                  !((m.from === username && m.to === partner) ||
                    (m.from === partner && m.to === username))
              );
              return [...otherMessages, ...data.messages];
            });
          }
        })
        .catch((err) => console.error("Failed to load message history:", err));
    },
    [token, username]
  );

  /**
   * Send a message
   */
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

  /**
   * Emit typing indicator
   */
  const emitTyping = useCallback(
    (to: string) => {
      if (!socketRef.current) return;
      socketRef.current.emit("typing", { to });
    },
    []
  );

  const emitStopTyping = useCallback(
    (to: string) => {
      if (!socketRef.current) return;
      socketRef.current.emit("stop-typing", { to });
    },
    []
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
        token,
        setToken,
        logout,
        isLoading,
        typingUser,
        emitTyping,
        emitStopTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
