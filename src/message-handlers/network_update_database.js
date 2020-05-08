// Update the local database and respond when the db is stable and on disk
// This should make sure all nodes are in sync with config details

const packetFactory = require("../utils/static/packetFactory");
const networkDatabase = require("../modules/network-database");


module.exports = function({ header, content, stream }) {
  const num = Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER - 1));

  

  const packet = packetFactory.newPacket({
    header: {
      type: "network_reply_generic",
      "xxh__responseto": header["xxh__packetid"]
    },
    content: {
      success: true // TODO maybe actual status?
    }
  }).packet;

  stream.write(packet);
};
