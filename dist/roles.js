/** Admin if DB role is admin, or legacy override: username `admin` is always treated as admin. */
export function isEffectiveAdmin(username, role) {
    return role === "admin" || username.toLowerCase() === "admin";
}
