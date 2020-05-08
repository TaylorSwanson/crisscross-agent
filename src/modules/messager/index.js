// Handles communication with other nodes over TCP
// This works both ways, sending messages to client peers and server peers

const async = require("async");

const packetFactory = require("../../utils/static/packetFactory");
const sharedcache = require("../sharedcache");


const clientConnections = [];

// Add a client stream, doesn't matter if it's a server or a client stream
module.exports.addClient = function(client) {
  clientConnections.push(client);
};
module.exports.removeClient = function(client) {
  const idx = clientConnections.indexOf(client);
  if (idx === -1) {
    return console.log("Cannot remove non-existing client:", client);
  }

  // Remove client
  // Assumes that client has already been closed
  // TODO check this, if not close the connection here
  clientConnections.splice(idx, 1);
};

// Sends message to a specfic peer
// If wait == -1 then it will not time out
// If wait == 0/undefined/null then it will not wait
// If wait > 0, the timeout is number of ms to timeout
module.exports.messagePeer = function(socket, type, payload, wait, callback) {

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
    throw new Error(`Packet id collision (!) : ${packetId}`);
  }


  // Start sending the packet
  socket.write(packet, callback);
  socket.on("error", err => {
    if (wait > 0 || wait === -1) {
      // Need to remove any handler
      delete sharedcache.pendingRequests[packetId];
    }
    
    return callback(err);
  });
  // // IDEA? Count bytes written and callback when the packet length is written
  // socket.on("drain", callback);



  // Store timeout ref in case the user has a timeout function
  let timeoutId;

  if (wait > 0 || wait === -1) {
    // User specified that the message should await reply

    // This handler will be called on reply or timeout regardless
    // It is also responsible for cleaning up after itself
    const fnHandler = (function() {
      return function() {
        clearInterval(timeoutId);

        // Callback would receive (err, { header, content, stream });
        callback(arguments);
        // Remove this handler
        delete sharedcache.pendingRequests[packetId];
      }
    })();

    // Save the pending request
    sharedcache.pendingRequests[packetId] = fnHandler();
  } else {
    
  }

  if (wait > 0) {
    // User specified that the message should have a timeout

    // Expire the response on timeout
    // IDEA start timeout when client is fully received?
    // IDEA https://nodejs.org/api/net.html#net_socket_byteswritten
    timeoutId = setTimeout(() => {
      fnHandler(new Error("Reply timed out"));
    }, wait);
  }
};


// Sends messages to all connected peers
// If wait == -1 then it will not time out
// If wait == 0/undefined/null then it will not wait
// If wait > 0, the timeout is number of ms to timeout
module.exports.messageAllPeers = function(type, payload, wait, callback) {
  // Message to send:
  async.each(clientConnections, (client, callback) => {
    module.exports.messagePeer(client, type, payload, wait, callback);
  }, callback);
};

