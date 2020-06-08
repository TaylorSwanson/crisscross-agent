// Simply responds with true to indicate that the server is responsive

import os from "os";
const hostname = os.hostname();

import * as groupTimer from "../modules/group-timer";
import * as aliveWatcher from "../modules/alive-watcher";
import * as messager from "../modules/messager";

const xxp = require("xxp");

module.exports = function({ header, content, socket }) {

  console.log(`${hostname} - Keepalive packet received, responding...`);

  messager.messagePeer(socket, "network_reply_generic", {
    header: {
      "xxp__responseto": header["xxp__packetid"]
    }, 
    content: {
      alive: Date.now()
    }
  }, 1000, (err) => {
    if (err) return console.error(err);

    // Restart the random timer so we don't send the message too often
    groupTimer.randomTimer("alive", 60, 10, aliveWatcher.keepAliveFunction);
  });
};
