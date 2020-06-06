// Determines if we've been accepted or not
// If not, we should disconnect

const packetFactory = require("xxp").packetFactory;
// const sharedcache = require("../modules/sharedcache");
const messager = require("../modules/messager");

const hostname = require("os").hostname().trim().toLowerCase();

module.exports = function({ header, content, stream }) {

  if (content.status == "accepted") {
    console.log(`${hostname} - peer at ${stream.address().address} replied:`, content);

    messager.addClient({
      socket: stream,
      name: content.name
    });
  } else {
    console.log(`${hostname} - peer at ${stream.address().address} rejected us: ${content.status}`);
  }
  
};
