// Handles communication with other nodes over TCP
// This works both ways, sending messages to client peers and server peers

const async = require("async");

const packetFactory = require("xxp").packetFactory;
const sharedcache = require("../sharedcache");

// sharedcache.clientConnections = [];
// const clientConnections = sharedcache.clientConnections;
const clientConnections = [];

// Add a client stream, doesn't matter if it's a server or a client stream
module.exports.addClient = function(client) {
  // Client should be an object with this signature:
  /*
  {
    socket,
    name
  }
  */

  if (clientConnections.some(c => c.name === client.name)) {
    return console.warn("Client was already added to the messager:", client.name);
  }

  clientConnections.push(client);
};
module.exports.removeClient = function(client) {
  const idx = clientConnections.findIndex(c => c.name == client.name);
  if (idx === -1) {
    return console.log("Cannot remove non-existing client:", client.name);
  }

  // Remove client
  // Assumes that client has already been closed
  // TODO check this, if not close the connection here
  clientConnections.splice(idx, 1);
};

// Get list of all connected ip addresses
module.exports.getAllClientAddresses = function() {
  return clientConnections.map(c => ({
    address: c.socket.address().address,
    name: c.name
  }));
};

// Sends message to a specfic peer
// If timeout == -1 then it will not time out
// If timeout == 0/undefined/null then it will not time out
// If timeout > 0, the timeout is number of ms
// TODO switch wait param with options obj
module.exports.messagePeer = function(socket, type, payload, timeout, callback) {

  const packet = packetFactory.newPacket({
    header: { type }, content: payload
  });
  const packetId = packet.id;

  // Store the handler/callback in the shared cache
  if (!sharedcache.hasOwnProperty("pendingRequests")) {
    sharedcache.pendingRequests = {};
  }

  // Check for strange occurrences
  if (sharedcache.pendingRequests.hasOwnProperty(packetId)) {
    console.warn(`Packet id collision (!) : ${packetId}`);
  }

  // Start sending the packet
  socket.write(packet.packet, function() {
    // Determine if we timeout or not
    // If not, we're done when the packet is sent
    if (!(timeout === -1 || timeout > 0))
      return callback(...arguments);
  });
  socket.on("error", err => {
    if (timeout > 0 || timeout === -1) {
      // Need to remove any handler
      delete sharedcache.pendingRequests[packetId];
    }
    
    return callback(err);
  });  

  if (timeout > 0 || timeout === -1) {
    // User specified that the message should await reply
    let timeoutId;

    // This handler will be called on reply or timeout regardless
    // It is also responsible for cleaning up after itself
    const fnHandler = (function() {
      return function() {
        clearInterval(timeoutId);

        // Callback would receive (err, { header, content, stream });
        callback(...arguments);
        // Remove this handler to prevent duplicate callbacks
        delete sharedcache.pendingRequests[packetId];
      }
    })();

    // Save the pending request
    sharedcache.pendingRequests[packetId] = fnHandler;

    if (timeout > 0) {
      // User specified that the message should have a timeout
  
      // Expire the response on timeout
      // IDEA start timeout when client is fully received?
      timeoutId = setTimeout(() => {
        // "timed out" must be in the error message
        fnHandler(new Error("Reply timed out"));
      }, timeout);
    }
  } 
};


// Sends messages to all connected peers
// If wait == -1 then it will not time out
// If wait == 0/undefined/null then it will not wait
// If wait > 0, the timeout is number of ms to timeout
module.exports.messageAllPeers = function(type, payload, timeout, callback) {
  // Message to send:
  async.each(clientConnections, (client, callback) => {
    module.exports.messagePeer(client.socket, type, payload, timeout, callback);
  }, callback);
};

module.exports.askAllPeers = function(type, payload, timeout, callback) {

};
