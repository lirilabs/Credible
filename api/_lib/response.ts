export function json(res, data) {
  res.setHeader("Content-Type", "application/json");
  res.status(200).end(JSON.stringify({ data }));
}
