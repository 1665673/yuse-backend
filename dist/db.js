import mongoose from "mongoose";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { config } from "./config.js";
import { TaskModel } from "./models/Task.js";
import { UserModel } from "./models/User.js";
export async function connectDb() {
    await mongoose.connect(config.mongoUri);
    console.log("[db] Connected to MongoDB");
    await bootstrapAdmin();
    await seedSampleTaskIfEmpty();
}
async function bootstrapAdmin() {
    const { adminUsername, adminPassword } = config;
    if (!adminUsername?.trim() || !adminPassword)
        return;
    const existing = await UserModel.findOne({ username: adminUsername.trim().toLowerCase() });
    if (existing)
        return;
    await UserModel.create({
        username: adminUsername.trim().toLowerCase(),
        password: adminPassword,
        role: "admin",
    });
    console.log(`[db] Bootstrap admin user "${adminUsername}" created`);
}
async function seedSampleTaskIfEmpty() {
    const count = await TaskModel.countDocuments();
    if (count > 0)
        return;
    let path = config.sampleTaskPath;
    if (!path) {
        const guess = join(process.cwd(), "../demo/dev/task-sample.v4.8.json");
        path = existsSync(guess) ? guess : "";
    }
    else if (!existsSync(path)) {
        console.warn("[db] SAMPLE_TASK_PATH not found:", path);
        return;
    }
    if (!path) {
        console.log("[db] No sample task path; database has no tasks (import via admin UI).");
        return;
    }
    try {
        const raw = readFileSync(path, "utf-8");
        const task = JSON.parse(raw);
        const id = String(task.id ?? "");
        if (!id) {
            console.warn("[db] Sample task JSON has no id; skip seed.");
            return;
        }
        const language = task.taskModelLanguage === "en"
            ? "English"
            : String(task.taskModelLanguage ?? "English");
        await TaskModel.create({
            taskId: id,
            title: String(task.title ?? "Untitled"),
            language,
            status: "pending_review",
            createdAt: new Date("2026-02-12T15:31:20"),
            data: task,
        });
        console.log("[db] Seeded sample task:", id);
    }
    catch (e) {
        console.error("[db] Failed to seed sample task:", e);
    }
}
