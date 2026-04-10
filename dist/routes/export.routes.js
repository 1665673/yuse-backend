import { Router } from "express";
import { TaskModel } from "../models/Task.js";
import { toClientTaskExportV1 } from "../taskExport/toClientV1.js";
const router = Router();
/**
 * @openapi
 * /api/export/tasks/{taskId}:
 *   get:
 *     summary: Task JSON in third-party client export format (v1)
 *     description: Loads stored task data and returns an adapted JSON shape for external clients. Same visibility as GET /api/tasks/{taskId}.
 */
router.get("/tasks/:taskId", async (req, res) => {
    const doc = await TaskModel.findOne({ taskId: req.params.taskId }).lean();
    if (!doc?.data || typeof doc.data !== "object") {
        res.status(404).json({ error: "Not found" });
        return;
    }
    try {
        const payload = toClientTaskExportV1({
            data: doc.data,
            taskMeta: {
                taskId: doc.taskId,
                status: doc.status,
                createdAt: doc.createdAt,
                updatedAt: doc.updatedAt,
            },
        });
        res.json(payload);
    }
    catch (e) {
        console.error("export v1 failed", e);
        res.status(500).json({ error: "Export failed", message: e instanceof Error ? e.message : String(e) });
    }
});
export default router;
