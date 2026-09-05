import { Router, Response } from "express";
import Message from "../models/Message.js";
import { authenticateToken, AuthRequest } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * GET /api/messages/unread/counts
 * Fetch unread message counts for the authenticated user, grouped by sender.
 */
router.get(
  "/unread/counts",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const myUsername = req.user!.username;
      const counts = await Message.aggregate([
        { $match: { to: myUsername, status: { $ne: "seen" } } },
        { $group: { _id: "$from", count: { $sum: 1 } } },
      ]);

      const unreadMap: Record<string, number> = {};
      counts.forEach((item) => {
        unreadMap[item._id] = item.count;
      });

      res.json({ unreadCounts: unreadMap });
    } catch (err) {
      console.error("Fetch unread counts error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * PUT /api/messages/seen/:partnerUsername
 * Mark all unread messages from partnerUsername as seen.
 */
router.put(
  "/seen/:partnerUsername",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const myUsername = req.user!.username;
      const partner = req.params.partnerUsername;

      await Message.updateMany(
        { from: partner, to: myUsername, status: { $ne: "seen" } },
        { $set: { status: "seen" } }
      );

      res.json({ success: true });
    } catch (err) {
      console.error("Mark seen error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * GET /api/messages/:partnerUsername
 * Fetch chat history between the authenticated user and a partner.
 * Returns the last 100 messages, sorted by timestamp ascending.
 */
router.get(
  "/:partnerUsername",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const myUsername = req.user!.username;
      const partner = req.params.partnerUsername;

      if (!partner) {
        res.status(400).json({ error: "Partner username is required" });
        return;
      }

      const messages = await Message.find({
        $or: [
          { from: myUsername, to: partner },
          { from: partner, to: myUsername },
        ],
      })
        .sort({ timestamp: 1 })
        .limit(100)
        .lean();

      res.json({
        messages: messages.map((m) => ({
          ...m,
          status: m.status || "seen",
        })),
      });
    } catch (err) {
      console.error("Fetch messages error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
