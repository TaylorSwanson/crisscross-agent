// Simply responds with true to indicate that the server is responsive

import os from "os";
const hostname = os.hostname().trim().toLowerCase();

import * as groupTimer from "../modules/group-timer";
import * as aliveWatcher from "../modules/alive-watcher";
import * as messager from "../modules/messager";

const xxp = require("xxp");

module.exports = function({ header, content, socket }) {

  // console.log(`${hostname} - Keepalive packet received, responding...`);

  // We need a reply before we can add as client
  messager.replyToPeer({ header, content, socket }, {
    header: {},
    content: {
      alive: Date.now()
    }
  }, -1, (err) => {
    // Restart the random timer so we don't send the message too often
    groupTimer.randomTimer("alive", 60, 10, aliveWatcher.keepAliveFunction);


    if (err) return console.error(`${hostname} - `, err);
    console.log(`${hostname} - client at ${socket.address().address} is alive`);
  });
};
