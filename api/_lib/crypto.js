import crypto from "crypto";

const SECRET = Buffer.from(process.env.SECRET_KEY, "hex");

export function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", SECRET, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return {
    iv: iv.toString("hex"),
    data: encrypted,
    tag: cipher.getAuthTag().toString("hex")
  };
}

export function decrypt(obj) {
  if (!obj?.iv) return obj;

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    SECRET,
    Buffer.from(obj.iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(obj.tag, "hex"));

  let decrypted = decipher.update(obj.data, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
