import mongoose, { Schema, Document } from "mongoose";

export type TaskStatus = "draft" | "pending_review" | "production";

export interface ITask extends Document {
  taskId: string;
  title: string;
  language: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  data: Record<string, unknown>;
}

const taskSchema = new Schema<ITask>(
  {
    taskId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    language: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "pending_review", "production"],
      default: "draft",
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { versionKey: false }
);

taskSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const TaskModel = mongoose.model<ITask>("Task", taskSchema);
