// Simply responds with a random number
// Useful for elections?

const packetFactory = require("../utils/static/packetFactory");

module.exports = function({ header, content, stream }) {
  const num = Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER - 1));

  const packet = packetFactory.newPacket({
    header: {
      type: "network_reply_generic",
      "xxh__responseto": header["xxh__packetid"]
    },
    content: {
      number: num
    }
  }).packet;

  stream.write(packet);
};
