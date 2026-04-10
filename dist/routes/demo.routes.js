import { Router } from "express";
import { TaskModel } from "../models/Task.js";
const router = Router();
/** Single-task shortcut for the home demo: returns the most recently created task’s full JSON. */
router.get("/task", async (_req, res) => {
    const doc = await TaskModel.findOne().sort({ createdAt: -1 });
    if (!doc) {
        res.status(404).json({ error: "No tasks in database" });
        return;
    }
    res.json(doc.data);
});
export default router;
