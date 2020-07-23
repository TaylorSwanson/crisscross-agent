// Simply responds with a random number
// Useful for elections?

const xxp = require("xxp");

module.exports = function({ header, content, socket }) {
  const num = Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER - 1));

  const packet = xxp.packetFactory.newPacket({
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
