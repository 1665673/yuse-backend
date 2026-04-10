import jwt from "jsonwebtoken";
import { config } from "../config.js";
export function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
        res.status(401).json({ error: "Unauthorized", message: "Missing or invalid Authorization header" });
        return;
    }
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded;
        next();
    }
    catch {
        res.status(401).json({ error: "Unauthorized", message: "Invalid or expired token" });
    }
}
export function optionalAuth(req, res, next) {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
        next();
        return;
    }
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded;
    }
    catch {
        /* ignore */
    }
    next();
}
export function signToken(payload) {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" });
}
