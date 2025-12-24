export default function handler(req, res) {
  res.json({
    ok: true,
    service: "credible",
    time: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
