// This is a generic reply
// The header should have a reference to the original packet id that the
// response is aimed at

// This resolves a callback in the messager module

const packetFactory = require("xxp").packetFactory;
// const sharedcache = require("../modules/sharedcache");
const messager = require("../modules/messager");

const hostname = require("os").hostname().trim().toLowerCase();

module.exports = function({ header, content, stream }) {

  console.log(`${hostname} - client at ${stream.address().address} identified \
as ${content.name}`);

  messager.addClient({
    socket: stream,
    name: content.name
  });

  const packet = packetFactory.newPacket({
    header: {
      type: "network_handshake_status"
    },
    content: {
      status: "accepted",
      name: hostname
    }
  }).packet;
  
  // Let client know that we are accepting messages now
  stream.write(packet, () => {
    console.log(`${hostname} - client at ${stream.address().address} is accepted`);
  });
};
