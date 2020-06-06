// Simply responds with true to indicate that the server is responsive

import os from "os";
const hostname = os.hostname();

const groupTimer = require("../modules/group-timer");
const aliveWatcher = require("../modules/alive-watcher");

import * as xxp from "xxp";

module.exports = function({ header, content, socket }) {

  console.log(`${hostname} - Keepalive packet received, responding...`);

  const packet = xxp.newPacket({
    header: {
      type: "network_reply_generic",
      "xxp__responseto": header["xxp__packetid"]
    },
    content: {
      alive: Date.now()
    }
  }).packet;

  socket.write(packet);

  // Restart the random timer so we don't send the message too often
  groupTimer.randomTimer("alive", 60, 10, aliveWatcher);
};
