import "dotenv/config";

export const config = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/yuse",
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-change-me",
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  adminUsername: process.env.ADMIN_USERNAME,
  adminPassword: process.env.ADMIN_PASSWORD,
  sampleTaskPath: process.env.SAMPLE_TASK_PATH,
};
