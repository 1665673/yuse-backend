import mongoose, { Schema } from "mongoose";
const taskSchema = new Schema({
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
}, { versionKey: false });
taskSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});
export const TaskModel = mongoose.model("Task", taskSchema);
