import { ENV } from "./env.js";

export function requireAdmin(req) {
  if (req.headers["x-admin-key"] !== ENV.ADMIN_KEY) {
    throw new Error("Forbidden");
  }
}
