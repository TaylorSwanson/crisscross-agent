// This is a generic reply
// The header should have a reference to the original packet id that the
// response is aimed at

// This resolves a callback in the messager module

const packetFactory = require("../utils/static/packetFactory");
const sharedcache = require("../modules/sharedcache");

module.exports = function({ header, content, stream }) {

  if (!header.hasOwnProperty("xxh__responseto"))
    throw new Error("Received response packet with no responseTo header");

  if (!sharedcache.hasOwnProperty("pendingRequests"))
    return console.warn("No pendingRequests object in sharedcache");
  
  // Check for response packetid-specific handler
  if (!sharedcache.pendingRequests.hasOwnProperty(header["xxh__responseto"]))
    return console.log("Pending request is closed:", header["xxh__responseto"]);
  
  // Trigger the callback~
  const cbFunction = sharedcache.pendingRequests[header["xxh__responseto"]];
  cbFunction(null, { header, content, stream });
};
