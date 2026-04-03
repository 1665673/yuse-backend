import type { UserRole } from "./models/User.js";

/** Admin if DB role is admin, or legacy override: username `admin` is always treated as admin. */
export function isEffectiveAdmin(username: string, role: UserRole): boolean {
  return role === "admin" || username.toLowerCase() === "admin";
}
