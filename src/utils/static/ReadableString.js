// https://medium.com/@dupski/nodejs-creating-a-readable-stream-from-a-string-e0568597387f

const util = require("util");
const Readable = require("stream").Readable;

function ReadableString() {
  this.sent = false;
}

// Dirty and oldschool inherit
util.inherits(ReadableString, Readable);

ReadableString.prototype._read = function() {
  if (!this.sent) {
    this.push(Buffer.from(this.str));
    this.sent = true;
  } else {
    // EOF/Stream
    this.push(null);
  }
};

module.exports = ReadableString;
