import { Router, type Request, type Response } from "express";
import multer from "multer";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";
import { requireAuth } from "../middleware/auth.js";

const uploadDir = join(process.cwd(), "uploads");
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

const router = Router();

/**
 * @openapi
 * /api/upload:
 *   post:
 *     summary: Upload file (authenticated); returns public URL path
 *     tags: [Upload]
 *     security: [{ bearerAuth: [] }]
 */
router.post("/", requireAuth, upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }
  const base = process.env.PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;
  const url = `${base}/uploads/${req.file.filename}`;
  res.json({ url });
});

export default router;
