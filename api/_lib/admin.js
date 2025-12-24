import { ENV } from "./env.js";

export function isAdmin(req) {
  return req.headers["x-admin-key"] === ENV.ADMIN_KEY;
}
