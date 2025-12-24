export const config = { runtime: "nodejs" };

import "../_lib/env.js";

export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    message: "ENV OK"
  });
}
