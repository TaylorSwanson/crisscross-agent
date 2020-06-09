// This module's function makes sure that all nodes are alive by asking the
// network for their status and waiting for a reply

// This is triggered randomly

import os from "os";

import * as messager from "../messager";
// import groupTimer from "../group-timer";

const hostname = os.hostname().trim().toLowerCase();

export function keepAliveFunction() {
  console.log(`${hostname} - Asking peers if they are available`);

  // This gets called once 
  function peerRequestHandler(err: Error, { header, content, socket }) {
    if (err && err.message.includes("timed out")) {
      // There was a timeout, someone isn't responding
      // That node should be restarted
      // TODO socket is destroyed now, figure out who was missing
      console.log(`${hostname} - peer timed out (!): ${socket.address().address}`);

      // TODO actually do something
    } else if (err) {
      console.log(`${hostname} - peer request error:`, err);
      // TODO gracefully handle this
    }
  };

  messager.messageAllPeers("network_ask_alive", {}, 2000, peerRequestHandler);
};
