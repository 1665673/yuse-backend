import { Router } from "express";
import { TaskModel } from "../models/Task.js";
import { UserModel } from "../models/User.js";
import { TaskReviewModel } from "../models/TaskReview.js";
import { requireAuth } from "../middleware/auth.js";
import { isEffectiveAdmin } from "../roles.js";
const router = Router();
function toSummary(doc) {
    return {
        id: doc.taskId,
        title: doc.title,
        language: doc.language,
        status: doc.status,
        createdAt: doc.createdAt.toISOString(),
    };
}
async function isAssignedReviewer(username, taskId) {
    const row = await TaskReviewModel.findOne({
        taskId,
        reviewerUsername: username.toLowerCase(),
    }).lean();
    return !!row;
}
/**
 * @openapi
 * /api/tasks:
 *   get:
 *     summary: List task summaries (admin sees all + assignee; reviewer sees assigned only)
 */
router.get("/", requireAuth, async (req, res) => {
    const u = req.user;
    let docs;
    if (isEffectiveAdmin(u.username, u.role)) {
        docs = await TaskModel.find().sort({ createdAt: -1 }).lean();
    }
    else if (u.role === "reviewer") {
        const ids = await TaskReviewModel.find({ reviewerUsername: u.username }).distinct("taskId");
        if (ids.length === 0) {
            res.json([]);
            return;
        }
        docs = await TaskModel.find({ taskId: { $in: ids } }).sort({ createdAt: -1 }).lean();
    }
    else {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    const taskIds = docs.map((d) => d.taskId);
    const assignments = taskIds.length > 0
        ? await TaskReviewModel.find({ taskId: { $in: taskIds } }).lean()
        : [];
    const assignMap = Object.fromEntries(assignments.map((a) => [a.taskId, a.reviewerUsername]));
    res.json(docs.map((d) => ({
        ...toSummary(d),
        assignedReviewer: assignMap[d.taskId] ?? null,
    })));
});
router.post("/", requireAuth, async (req, res) => {
    if (!req.user || !isEffectiveAdmin(req.user.username, req.user.role)) {
        res.status(403).json({ error: "Only admins can create tasks" });
        return;
    }
    try {
        const body = req.body;
        const taskId = String(body.id ?? `task-${Date.now()}`);
        const title = String(body.title ?? "Untitled");
        const language = String(body.language ?? "English");
        const status = body.status ?? "draft";
        const createdAt = body.createdAt ? new Date(String(body.createdAt)) : new Date();
        const data = body.data ??
            { id: taskId, title, version: "4.8" };
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
            data: { ...data, id: taskId, title: data.title ?? title },
        });
        res.status(201).json({ ...toSummary(doc), assignedReviewer: null });
    }
    catch (e) {
        console.error(e);
        res.status(400).json({ error: "Invalid request body" });
    }
});
/**
 * Assign or reassign a reviewer to a task (admin only).
 * POST body: { "reviewerUsername": "alice" }
 */
router.post("/:taskId/assignment", requireAuth, async (req, res) => {
    if (!req.user || !isEffectiveAdmin(req.user.username, req.user.role)) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }
    const taskId = req.params.taskId;
    const reviewerUsername = String(req.body?.reviewerUsername ?? "").trim().toLowerCase();
    if (!reviewerUsername) {
        res.status(400).json({ error: "reviewerUsername required" });
        return;
    }
    const task = await TaskModel.findOne({ taskId });
    if (!task) {
        res.status(404).json({ error: "Task not found" });
        return;
    }
    const reviewer = await UserModel.findOne({ username: reviewerUsername });
    if (!reviewer || reviewer.role !== "reviewer") {
        res.status(400).json({ error: "User is not a valid reviewer" });
        return;
    }
    await TaskReviewModel.findOneAndUpdate({ taskId }, {
        taskId,
        reviewerUsername,
        assignedBy: req.user.username,
        assignedAt: new Date(),
    }, { upsert: true, new: true });
    res.json({ ok: true, taskId, reviewerUsername });
});
/**
 * Stored task row + opaque `data` blob (no schema interpretation). Used by the Next.js app for export, etc.
 */
router.get("/:taskId/storage", async (req, res) => {
    const doc = await TaskModel.findOne({ taskId: req.params.taskId }).lean();
    if (!doc) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    res.json({
        taskId: doc.taskId,
        status: doc.status,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        data: doc.data,
    });
});
/**
 * @openapi
 * /api/tasks/{taskId}:
 *   get:
 *     summary: Full task JSON (public — learner demo)
 */
router.get("/:taskId", async (req, res) => {
    const doc = await TaskModel.findOne({ taskId: req.params.taskId }).lean();
    if (!doc?.data || typeof doc.data !== "object") {
        res.status(404).json({ error: "Not found" });
        return;
    }
    res.json(doc.data);
});
router.put("/:taskId", requireAuth, async (req, res) => {
    const u = req.user;
    const taskId = req.params.taskId;
    if (!isEffectiveAdmin(u.username, u.role)) {
        if (u.role !== "reviewer") {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        const ok = await isAssignedReviewer(u.username, taskId);
        if (!ok) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
    }
    const doc = await TaskModel.findOne({ taskId });
    if (!doc) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    try {
        const data = req.body;
        doc.data = data;
        doc.title = String(data.title ?? doc.title);
        await doc.save();
        res.json({ ok: true });
    }
    catch {
        res.status(400).json({ error: "Invalid request body" });
    }
});
router.delete("/:taskId", requireAuth, async (req, res) => {
    if (!req.user || !isEffectiveAdmin(req.user.username, req.user.role)) {
        res.status(403).json({ error: "Only admins can delete tasks" });
        return;
    }
    const r = await TaskModel.deleteOne({ taskId: req.params.taskId });
    if (r.deletedCount === 0) {
        res.status(404).json({ error: "Not found" });
        return;
    }
    await TaskReviewModel.deleteOne({ taskId: req.params.taskId }).catch(() => { });
    res.json({ ok: true });
});
export default router;
