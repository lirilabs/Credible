export function requireAdmin(req) {
  const key = req.headers["x-admin-key"];
  if (!key || key !== process.env.ADMIN_KEY) {
    throw new Error("Unauthorized");
  }
}
