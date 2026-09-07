"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
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
  allUsers: ChatPartner[];
  onlineUsers: ChatPartner[];
  offlineUsers: ChatPartner[];
  refreshUsers: () => void;
  unreadCounts: Record<string, number>;
  messages: Message[];
  sendMessage: (to: string, content: string) => void;
  currentChat: string | null;
  setCurrentChat: (username: string | null) => void;
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
  isLoading: boolean;
  isChatLoading: boolean;
  reloadChat: () => void;
  typingUser: string | null;
  emitTyping: (to: string) => void;
  emitStopTyping: (to: string) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  username: "",
  setUsername: () => {},
  allUsers: [],
  onlineUsers: [],
  offlineUsers: [],
  refreshUsers: () => {},
  unreadCounts: {},
  messages: [],
  sendMessage: () => {},
  currentChat: null,
  setCurrentChat: () => {},
  token: null,
  setToken: () => {},
  logout: () => {},
  isLoading: true,
  isChatLoading: false,
  reloadChat: () => {},
  typingUser: null,
  emitTyping: () => {},
  emitStopTyping: () => {},
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [registeredUsers, setRegisteredUsers] = useState<string[]>([]);
  const [onlineUsernames, setOnlineUsernames] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChat, setCurrentChatState] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const currentChatRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    currentChatRef.current = currentChat;
  }, [currentChat]);

  /**
   * Fetch registered users from backend
   */
  const fetchRegisteredUsers = useCallback(async (authToken?: string) => {
    const activeToken =
      authToken || token || (typeof window !== "undefined" ? localStorage.getItem("chatpulse_token") : null);
    if (!activeToken) return;

    try {
      const res = await fetch(`${API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.users)) {
        setRegisteredUsers(data.users.map((u: { username: string }) => u.username));
      }
    } catch (err) {
      console.error("Failed to fetch registered users:", err);
    }
  }, [token]);

  /**
   * Fetch initial unread counts from backend
   */
  const fetchUnreadCounts = useCallback(async (authToken?: string) => {
    const activeToken =
      authToken || token || (typeof window !== "undefined" ? localStorage.getItem("chatpulse_token") : null);
    if (!activeToken) return;

    try {
      const res = await fetch(`${API_URL}/messages/unread/counts`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.unreadCounts) {
        setUnreadCounts(data.unreadCounts);
      }
    } catch (err) {
      console.error("Failed to fetch unread counts:", err);
    }
  }, [token]);

  const refreshUsers = useCallback(() => {
    fetchRegisteredUsers();
  }, [fetchRegisteredUsers]);

  /**
   * Fetch users and unread counts whenever token changes
   */
  useEffect(() => {
    if (token) {
      fetchRegisteredUsers(token);
      fetchUnreadCounts(token);
    }
  }, [token, fetchRegisteredUsers, fetchUnreadCounts]);

  /**
   * Computed list of all users with live online/offline status
   */
  const allUsers = useMemo<ChatPartner[]>(() => {
    const nameSet = new Set<string>();
    registeredUsers.forEach((name) => {
      if (name && name !== username) nameSet.add(name);
    });
    onlineUsernames.forEach((name) => {
      if (name && name !== username) nameSet.add(name);
    });

    const onlineSet = new Set(onlineUsernames);

    return Array.from(nameSet).map((name) => ({
      username: name,
      socketId: "",
      isOnline: onlineSet.has(name),
    }));
  }, [registeredUsers, onlineUsernames, username]);

  const onlineUsers = useMemo(
    () => allUsers.filter((u) => u.isOnline),
    [allUsers]
  );

  const offlineUsers = useMemo(
    () => allUsers.filter((u) => !u.isOnline),
    [allUsers]
  );

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
    setRegisteredUsers([]);
    setOnlineUsernames([]);
    setMessages([]);
    setUnreadCounts({});
    setCurrentChatState(null);
    currentChatRef.current = null;
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
        fetchRegisteredUsers(storedToken);
        fetchUnreadCounts(storedToken);
      })
      .catch(() => {
        localStorage.removeItem("chatpulse_token");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [fetchRegisteredUsers, fetchUnreadCounts]);

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

    newSocket.on("user-list", (users: { username: string }[]) => {
      const onlineNames = users
        .map((u) => u.username)
        .filter((name) => name !== username);
      setOnlineUsernames(onlineNames);
    });

    newSocket.on("receive-message", (message: Message) => {
      const isViewing = currentChatRef.current === message.from;

      if (isViewing) {
        const seenMessage: Message = { ...message, status: "seen" };
        setMessages((prev) => [...prev, seenMessage]);

        // Inform sender and backend that message was seen
        newSocket.emit("mark-seen", { from: message.from });
        if (token) {
          fetch(`${API_URL}/messages/seen/${message.from}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
      } else {
        setMessages((prev) => [...prev, message]);
        setUnreadCounts((prev) => ({
          ...prev,
          [message.from]: (prev[message.from] || 0) + 1,
        }));
      }
    });

    newSocket.on("message-sent", (message: Message) => {
      setMessages((prev) => {
        const existsIndex = prev.findIndex((m) => m.id === message.id);
        if (existsIndex >= 0) {
          const updated = [...prev];
          updated[existsIndex] = { ...updated[existsIndex], status: message.status || "sent" };
          return updated;
        }
        return [...prev, message];
      });
    });

    newSocket.on("messages-seen", (data: { by: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.to === data.by && m.from === username ? { ...m, status: "seen" } : m
        )
      );
    });

    newSocket.on("messages-delivered", (data: { to: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.to === data.to && m.from === username && m.status === "sent"
            ? { ...m, status: "delivered" }
            : m
        )
      );
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
      currentChatRef.current = partner;
      setTypingUser(null);

      if (!partner || !token) return;

      // Clear unread count for this partner
      setUnreadCounts((prev) => {
        if (!prev[partner]) return prev;
        const next = { ...prev };
        delete next[partner];
        return next;
      });

      // Mark messages as seen in socket and DB
      if (socketRef.current) {
        socketRef.current.emit("mark-seen", { from: partner });
      }

      fetch(`${API_URL}/messages/seen/${partner}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }).catch((err) => console.error("Failed to mark messages seen:", err));

      setIsChatLoading(true);
      fetch(`${API_URL}/messages/${partner}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.messages && Array.isArray(data.messages)) {
            // Replace messages for this conversation with server history,
            // then merge any client-side messages not yet in the history
            setMessages((prev) => {
              const otherMessages = prev.filter(
                (m) =>
                  !((m.from === username && m.to === partner) ||
                    (m.from === partner && m.to === username))
              );
              return [...otherMessages, ...data.messages];
            });
          }
        })
        .catch((err) => console.error("Failed to load message history:", err))
        .finally(() => setIsChatLoading(false));
    },
    [token, username]
  );

  /**
   * Reload current chat messages
   */
  const reloadChat = useCallback(() => {
    if (!currentChat || !token) return;
    setIsChatLoading(true);
    fetch(`${API_URL}/messages/${currentChat}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.messages && Array.isArray(data.messages)) {
          setMessages((prev) => {
            const otherMessages = prev.filter(
              (m) =>
                !((m.from === username && m.to === currentChat) ||
                  (m.from === currentChat && m.to === username))
            );
            return [...otherMessages, ...data.messages];
          });
        }
      })
      .catch((err) => console.error("Failed to reload message history:", err))
      .finally(() => setIsChatLoading(false));
  }, [currentChat, token, username]);

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
        status: "sent",
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
        allUsers,
        onlineUsers,
        offlineUsers,
        refreshUsers,
        unreadCounts,
        messages,
        sendMessage,
        currentChat,
        setCurrentChat,
        token,
        setToken,
        logout,
        isLoading,
        isChatLoading,
        reloadChat,
        typingUser,
        emitTyping,
        emitStopTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
