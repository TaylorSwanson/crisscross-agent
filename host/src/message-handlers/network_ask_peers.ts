// Someone is asking for a new list of peers

// import sharedcache from "../modules/sharedcache";

import os from "os";

const xxp = require("xxp");
import * as messager from "../modules/messager"; 

const hostname = os.hostname().trim().toLowerCase();

module.exports = function({ header, content, socket }) {

  const packet = xxp.packetFactory.newPacket({
    header: {
      type: "network_reply_generic",
      "xxp__responseto": header["xxp__packetid"]
    },
    content: {
      // peers: sharedcache["peers"] || [],
      all: messager.getAllConnectionAddresses()
    }
  }).packet;
  
  socket.write(packet);
};
