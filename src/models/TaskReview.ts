import mongoose, { Schema, Document } from "mongoose";

/**
 * Which reviewer is assigned to review which task (admin assigns via UI).
 * One row per task (unique taskId).
 */
export interface ITaskReview extends Document {
  taskId: string;
  reviewerUsername: string;
  assignedAt: Date;
  assignedBy: string;
}

const taskReviewSchema = new Schema<ITaskReview>(
  {
    taskId: { type: String, required: true, unique: true, index: true },
    reviewerUsername: { type: String, required: true, lowercase: true, trim: true, index: true },
    assignedAt: { type: Date, default: Date.now },
    assignedBy: { type: String, required: true },
  },
  { versionKey: false }
);

export const TaskReviewModel = mongoose.model<ITaskReview>("TaskReview", taskReviewSchema);
