import { ENV } from "./env";

export function requireAdmin(req: any) {
  const key = req.headers["x-admin-key"];
  if (key !== ENV.ADMIN_KEY) {
    throw new Error("Forbidden");
  }
}
