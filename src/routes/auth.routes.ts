import { Router, type Request, type Response } from "express";
import { UserModel, verifyPassword } from "../models/User.js";
import { requireAuth, signToken } from "../middleware/auth.js";

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Sign up (always creates a reviewer account)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Username taken
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const username = String(req.body?.username ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");
    if (username.length < 2 || username.length > 64) {
      res.status(400).json({ error: "Username must be 2–64 characters" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }
    const exists = await UserModel.findOne({ username });
    if (exists) {
      res.status(409).json({ error: "Username already taken" });
      return;
    }
    const user = await UserModel.create({
      username,
      password,
      role: "reviewer",
    });
    const token = signToken({
      sub: String(user._id),
      username: user.username,
      role: user.role,
    });
    res.status(201).json({
      token,
      user: { id: String(user._id), username: user.username, role: user.role },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Registration failed" });
  }
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const username = String(req.body?.username ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");
    const user = await UserModel.findOne({ username }).select("+password");
    if (!user || !(await verifyPassword(password, user.password))) {
      res.status(401).json({ error: "Invalid username or password" });
      return;
    }
    const token = signToken({
      sub: String(user._id),
      username: user.username,
      role: user.role,
    });
    res.json({
      token,
      user: { id: String(user._id), username: user.username, role: user.role },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Current user (JWT)
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/me", requireAuth, (req: Request, res: Response) => {
  res.json({
    user: {
      id: req.user!.sub,
      username: req.user!.username,
      role: req.user!.role,
    },
  });
});

export default router;
