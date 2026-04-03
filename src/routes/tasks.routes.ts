import { Router, type Request, type Response } from "express";
import type { TaskStatus } from "../models/Task.js";
import { TaskModel } from "../models/Task.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function toSummary(doc: { taskId: string; title: string; language: string; status: string; createdAt: Date }) {
  return {
    id: doc.taskId,
    title: doc.title,
    language: doc.language,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
  };
}

/**
 * @openapi
 * /api/tasks:
 *   get:
 *     summary: List task summaries (authenticated)
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 */
router.get("/", requireAuth, async (_req: Request, res: Response) => {
  const docs = await TaskModel.find().sort({ createdAt: -1 }).lean();
  res.json(docs.map((d) => toSummary(d)));
});

/**
 * @openapi
 * /api/tasks:
 *   post:
 *     summary: Create task (authenticated)
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 */
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    const taskId = String(body.id ?? `task-${Date.now()}`);
    const title = String(body.title ?? "Untitled");
    const language = String(body.language ?? "English");
    const status = (body.status as TaskStatus) ?? "draft";
    const createdAt = body.createdAt ? new Date(String(body.createdAt)) : new Date();
    const data =
      (body.data as Record<string, unknown>) ??
      ({ id: taskId, title, version: "4.8" } as Record<string, unknown>);

    if (await TaskModel.findOne({ taskId })) {
      res.status(409).json({ error: "Task id already exists" });
      return;
    }

    const doc = await TaskModel.create({
      taskId,
      title,
      language,
      status,
      createdAt,
      data: { ...data, id: taskId, title: (data.title as string) ?? title },
    });
    res.status(201).json(toSummary(doc));
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Invalid request body" });
  }
});

/**
 * @openapi
 * /api/tasks/{taskId}:
 *   get:
 *     summary: Full task JSON (public — learner demo)
 *     tags: [Tasks]
 */
router.get("/:taskId", async (req: Request, res: Response) => {
  const doc = await TaskModel.findOne({ taskId: req.params.taskId });
  if (!doc) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(doc.data);
});

/**
 * @openapi
 * /api/tasks/{taskId}:
 *   put:
 *     summary: Replace task JSON (authenticated)
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 */
router.put("/:taskId", requireAuth, async (req: Request, res: Response) => {
  const doc = await TaskModel.findOne({ taskId: req.params.taskId });
  if (!doc) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  try {
    const data = req.body as Record<string, unknown>;
    doc.data = data;
    doc.title = String(data.title ?? doc.title);
    await doc.save();
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: "Invalid request body" });
  }
});

/**
 * @openapi
 * /api/tasks/{taskId}:
 *   delete:
 *     summary: Delete task (authenticated)
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 */
router.delete("/:taskId", requireAuth, async (req: Request, res: Response) => {
  const r = await TaskModel.deleteOne({ taskId: req.params.taskId });
  if (r.deletedCount === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ok: true });
});

export default router;
