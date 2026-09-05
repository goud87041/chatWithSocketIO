import { Server, Socket } from "socket.io";

interface ConnectedUser {
  username: string;
  socketId: string;
  isOnline: boolean;
}

interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: number;
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
 */
export function registerSocketHandlers(io: Server): void {
  io.on("connection", (socket: Socket) => {
    const username = socket.handshake.query.username as string;

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

    // Handle incoming messages
    socket.on("send-message", (message: Message) => {
      const recipient = onlineUsers.get(message.to);

      // Send to recipient if they are online
      if (recipient) {
        io.to(recipient.socketId).emit("receive-message", message);
      }

      // Echo back to sender as confirmation
      socket.emit("message-sent", message);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${username} (${socket.id})`);
      onlineUsers.delete(username);
      broadcastUserList(io);
    });
  });
}
