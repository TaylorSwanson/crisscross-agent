// Simply responds with a random number
// Useful for elections?

import sharedcache from "../modules/sharedcache";

const xxp = require("xxp");

module.exports = function({ header, content, socket }) {

  const packet = xxp.packetFactory.newPacket({
    header: {
      type: "network_reply_generic",
      "xxp__responseto": header["xxp__packetid"]
    },
    content: {
      uptime: new Date().getTime() - sharedcache["starttime"]
    }
  }).packet;

  socket.write(packet);
};
