import { Router } from "express";
import multer from "multer";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";
import { requireAuth } from "../middleware/auth.js";
const uploadDir = join(process.cwd(), "uploads");
if (!existsSync(uploadDir))
    mkdirSync(uploadDir, { recursive: true });
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
router.post("/", requireAuth, upload.single("file"), (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
    }
    const path = `/uploads/${req.file.filename}`;
    /** Optional absolute base when the API is on a different public host than the Next app (omit for same-origin `/uploads/...` via proxy). */
    const base = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
    const url = base ? `${base}${path}` : path;
    res.json({ url });
});
export default router;
