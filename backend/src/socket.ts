import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "./models/Message.js";

interface ConnectedUser {
  username: string;
  socketId: string;
  isOnline: boolean;
}

interface MessagePayload {
  id?: string;
  _id?: string;
  from: string;
  to: string;
  content: string;
  timestamp: number;
  status?: "sent" | "delivered" | "seen";
}

// In-memory store of connected users: username -> ConnectedUser
const onlineUsers = new Map<string, ConnectedUser>();

/**
 * Returns the current online users list as an array.
 */
function getUserList(): ConnectedUser[] {
  return Array.from(onlineUsers.values());
}

/**
 * Broadcasts the updated user list to all connected clients.
 */
function broadcastUserList(io: Server): void {
  io.emit("user-list", getUserList());
}

/**
 * Registers all Socket.IO event handlers.
 * Connections are authenticated via JWT token sent in socket.handshake.auth.
 */
export function registerSocketHandlers(io: Server): void {
  // Authenticate socket connections via JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string;

    // Also support query-based username for backward compatibility
    if (!token && socket.handshake.query.username) {
      return next();
    }

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
        username: string;
      };
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket: Socket) => {
    // Get username from JWT or fallback to query param
    const username =
      (socket as any).user?.username ||
      (socket.handshake.query.username as string);

    if (!username) {
      socket.disconnect(true);
      return;
    }

    console.log(`✅ User connected: ${username} (${socket.id})`);

    // Track the user
    onlineUsers.set(username, {
      username,
      socketId: socket.id,
      isOnline: true,
    });

    // Broadcast updated user list to everyone
    broadcastUserList(io);

    // On user connect, update any messages waiting in 'sent' status to 'delivered'
    try {
      const pendingSent = await Message.find({ to: username, status: "sent" }).lean();
      if (pendingSent.length > 0) {
        await Message.updateMany(
          { to: username, status: "sent" },
          { $set: { status: "delivered" } }
        );
        const senders = new Set(pendingSent.map((m) => m.from));
        senders.forEach((senderName) => {
          const sender = onlineUsers.get(senderName);
          if (sender) {
            io.to(sender.socketId).emit("messages-delivered", { to: username });
          }
        });
      }
    } catch (err) {
      console.error("Error updating pending sent messages:", err);
    }

    // Handle incoming messages — relay + persist to DB
    socket.on("send-message", async (message: MessagePayload) => {
      // Validate message
      if (!message.to || !message.content?.trim()) return;

      const recipient = onlineUsers.get(message.to);
      const initialStatus: "sent" | "delivered" = recipient ? "delivered" : "sent";

      const msgWithStatus: MessagePayload = {
        ...message,
        status: initialStatus,
      };

      // Persist message to MongoDB
      try {
        const savedMsg = await Message.create({
          from: message.from,
          to: message.to,
          content: message.content.trim(),
          timestamp: message.timestamp || Date.now(),
          status: initialStatus,
        });
        msgWithStatus._id = savedMsg._id.toString();
      } catch (err) {
        console.error("Failed to save message:", err);
      }

      // Send to recipient if they are online
      if (recipient) {
        io.to(recipient.socketId).emit("receive-message", msgWithStatus);
      }

      // Echo back to sender as confirmation with assigned status
      socket.emit("message-sent", msgWithStatus);
    });

    // Handle mark-seen event (when user views a conversation)
    socket.on("mark-seen", async (data: { from: string }) => {
      const senderUsername = data.from;
      if (!senderUsername) return;

      try {
        await Message.updateMany(
          { from: senderUsername, to: username, status: { $ne: "seen" } },
          { $set: { status: "seen" } }
        );

        const sender = onlineUsers.get(senderUsername);
        if (sender) {
          io.to(sender.socketId).emit("messages-seen", { by: username });
        }
      } catch (err) {
        console.error("Failed to mark messages seen:", err);
      }
    });

    // Handle typing events
    socket.on("typing", (data: { to: string }) => {
      const recipient = onlineUsers.get(data.to);
      if (recipient) {
        io.to(recipient.socketId).emit("user-typing", { username });
      }
    });

    socket.on("stop-typing", (data: { to: string }) => {
      const recipient = onlineUsers.get(data.to);
      if (recipient) {
        io.to(recipient.socketId).emit("user-stopped-typing", { username });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${username} (${socket.id})`);
      onlineUsers.delete(username);
      broadcastUserList(io);
    });
  });
}
