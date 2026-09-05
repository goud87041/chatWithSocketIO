import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authenticateToken, AuthRequest } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * Generate a JWT token for a user.
 */
function generateToken(id: string, username: string): string {
  return jwt.sign({ id, username }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });
}

/**
 * POST /api/auth/register
 * Create a new user account.
 */
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 3) {
      res.status(400).json({ error: "Username must be at least 3 characters" });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      res.status(400).json({
        error: "Username can only contain letters, numbers, and underscores",
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username: trimmedUsername });
    if (existingUser) {
      res.status(409).json({ error: "Username is already taken" });
      return;
    }

    // Create user
    const user = new User({ username: trimmedUsername, password });
    await user.save();

    // Generate token
    const token = generateToken(user._id.toString(), user.username);

    res.status(201).json({
      token,
      user: { id: user._id, username: user.username },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/auth/login
 * Authenticate a user and return a JWT.
 */
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    // Find user
    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }

    // Generate token
    const token = generateToken(user._id.toString(), user.username);

    res.json({
      token,
      user: { id: user._id, username: user.username },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/auth/me
 * Get current user from JWT (for session restore on page refresh).
 */
router.get(
  "/me",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.user!.id).select("-password");
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({ user: { id: user._id, username: user.username } });
    } catch (err) {
      console.error("Me error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
