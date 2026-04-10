import mongoose, { Schema } from "mongoose";
const taskReviewSchema = new Schema({
    taskId: { type: String, required: true, unique: true, index: true },
    reviewerUsername: { type: String, required: true, lowercase: true, trim: true, index: true },
    assignedAt: { type: Date, default: Date.now },
    assignedBy: { type: String, required: true },
}, { versionKey: false });
export const TaskReviewModel = mongoose.model("TaskReview", taskReviewSchema);
