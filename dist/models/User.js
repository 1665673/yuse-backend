import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        minlength: 2,
        maxlength: 64,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "reviewer"], required: true },
    createdAt: { type: Date, default: Date.now },
}, { versionKey: false });
userSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});
export const UserModel = mongoose.model("User", userSchema);
export async function verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
}
