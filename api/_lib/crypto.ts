import crypto from "crypto";
import { ENV } from "./env";

const KEY = Buffer.from(ENV.SECRET_KEY, "hex");

export function encrypt(text: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    data: encrypted.toString("hex"),
    tag: tag.toString("hex")
  };
}

export function decrypt(p: any) {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    KEY,
    Buffer.from(p.iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(p.tag, "hex"));
  return decipher.update(p.data, "hex", "utf8") + decipher.final("utf8");
}

