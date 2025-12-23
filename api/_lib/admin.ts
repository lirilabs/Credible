import { ENV } from "./env";

export function requireAdmin(req: any) {
  if (req.headers["x-admin-key"] !== ENV.ADMIN_KEY) {
    throw new Error("Forbidden");
  }
}

