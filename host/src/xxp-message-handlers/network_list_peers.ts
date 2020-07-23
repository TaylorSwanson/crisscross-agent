// Someone is asking for a new list of peers

// import sharedcache from "../modules/sharedcache";

import os from "os";

const xxp = require("xxp");
import * as messager from "../modules/messager"; 

const hostname = os.hostname().trim().toLowerCase();

module.exports = function({ header, content, socket }) {

  // messager.messagePeer(socket, "network_reply_generic", {
  //   header: {
  //     "xxp__responseto": header["xxp__packetid"]
  //   },
  //   content: {
  //     // peers: sharedcache["peers"] || [],
  //     all: messager.getAllConnectionAddresses()
  //   }
  // }, 3000, (err) => {
  //   if (err) console.error(err);
  // });
};
