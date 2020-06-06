// Simply responds with a random number
// Useful for elections?

const packetFactory = require("xxp").packetFactory;

module.exports = function({ header, content, socket }) {
  const num = Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER - 1));

  const packet = packetFactory.newPacket({
    header: {
      type: "network_reply_generic",
      "xxp__responseto": header["xxp__packetid"]
    },
    content: {
      number: num
    }
  }).packet;

  socket.write(packet);
};
