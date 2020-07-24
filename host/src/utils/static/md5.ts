// Symple node crypto md5 wrapper function
import crypto from "crypto";

export default function digest(string: string, encoding: any): string {
  const hash = crypto.createHash("md5");
  return hash.update(string, "utf8").digest(encoding || "hex");
};
