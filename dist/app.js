import express from "express";
import cors from "cors";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { config } from "./config.js";
import { swaggerSpec } from "./swagger.js";
import authRoutes from "./routes/auth.routes.js";
import tasksRoutes from "./routes/tasks.routes.js";
import demoRoutes from "./routes/demo.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
export function createApp() {
    const app = express();
    app.use(cors({
        origin: config.corsOrigins,
        credentials: true,
    }));
    app.use(express.json({ limit: "50mb" }));
    app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get("/health", (_req, res) => {
        res.json({ ok: true });
    });
    app.use("/api/auth", authRoutes);
    app.use("/api/tasks", tasksRoutes);
    app.use("/api/upload", uploadRoutes);
    app.use("/api", demoRoutes);
    return app;
}
