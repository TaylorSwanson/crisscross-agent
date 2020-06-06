// Someone is asking for a new list of peers

// import sharedcache from "../modules/sharedcache";

import os from "os";

import * as xxp from "xxp";
import * as messager from "../modules/messager"; 

const hostname = os.hostname().trim().toLowerCase();

export default function({ header, content, socket }) {

  const packet = xxp.newPacket({
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
