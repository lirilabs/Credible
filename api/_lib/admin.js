export function isAdmin(req) {
  return req.headers["x-admin-key"] === process.env.ADMIN_KEY;
}
