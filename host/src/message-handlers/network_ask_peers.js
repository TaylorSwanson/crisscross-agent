// Someone is asking for a new list of peers
// If there are no other peers return [], the other peer already knows about
// this server if they've contacted us

const packetFactory = require("xxp").packetFactory;

const sharedcache = require("../modules/sharedcache");
const messager = require("../modules/messager");

module.exports = function({ header, content, socket }) {
  const num = Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER - 1));

  const packet = packetFactory.newPacket({
    header: {
      type: "network_reply_generic",
      "xxp__responseto": header["xxp__packetid"]
    },
    content: {
      // peers: sharedcache["peers"] || [],
      all: messager.getAllConnetionAddresses()
    }
  }).packet;
  
  socket.write(packet);
};
