import { Router, Response } from "express";
import Message from "../models/Message.js";
import { authenticateToken, AuthRequest } from "../middleware/authMiddleware.js";

const router = Router();

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

      res.json({ messages });
    } catch (err) {
      console.error("Fetch messages error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
