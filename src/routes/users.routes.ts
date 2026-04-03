import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { UserModel } from "../models/User.js";
import { isEffectiveAdmin } from "../roles.js";

const router = Router();

/**
 * List usernames with role `reviewer` (for assign dropdown). Admin only.
 */
router.get("/reviewers", requireAuth, async (req: Request, res: Response) => {
  if (!req.user || !isEffectiveAdmin(req.user.username, req.user.role)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const reviewers = await UserModel.find({ role: "reviewer" }).select("username").sort({ username: 1 }).lean();
  res.json({ reviewers: reviewers.map((u) => ({ username: u.username })) });
});

export default router;
