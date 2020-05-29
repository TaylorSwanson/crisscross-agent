// Symple node crypto md5 wrapper function
const crypto = require("crypto");

module.exports = function digest(string, encoding) {
  const hash = crypto.createHash("md5");
  return hash.update(string, "utf8").digest(encoding || "hex");
};
