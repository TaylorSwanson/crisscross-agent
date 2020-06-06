// Simply responds with true to indicate that the server is responsive

const os = require("os");
const hostname = os.hostname();

const groupTimer = require("../modules/group-timer");
const aliveWatcher = require("../modules/alive-watcher");

const packetFactory = require("xxp").packetFactory;

module.exports = function({ header, content, stream }) {

  console.log(`${hostname} - Keepalive packet received, responding...`);

  const packet = packetFactory.newPacket({
    header: {
      type: "network_reply_generic",
      "xxh__responseto": header["xxh__packetid"]
    },
    content: {
      alive: Date.now()
    }
  }).packet;

  stream.write(packet);

  // Restart the random timer so we don't send the message too often
  groupTimer.randomTimer("alive", 60, 10, aliveWatcher);
};
