// Handles communication with other nodes over TCP
// This works both ways, sending messages to client peers and server peers

const config = require("config");

const packetFactory = require("../../utils/static/packetFactory");
const sharedcache = require("../sharedcache");


const timeout = config.get("netTimeout") || 10000;

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

// Sends messages to all connected peers
module.exports.messagePeers = function(type, payload) {
  // Message to send:
  const packet = packetFactory.newPacket({
    header: { type }, content: payload
  }).packet;
  clientConnections.forEach(client => {
    client.write(packet);
  });
};

// Sends message to a specfic peer
module.exports.messagePeer = function(type, payload, callback) {
  
};

// Messages a peer and specifically waits for a reply
// If timeout set to 0, wait indefinitely
// Timeout is optional
module.exports.askPeer = function(socket, type, payload, timeout, callback) {
  if (!callback && typeof timeout == "function") {
    callback = timeout;
  } else if (callback) {
    throw new Error("Expected 3 parameters, got 4");
  }

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
  socket.write(packet);



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

  // Expire the response on timeout
  // IDEA start timeout when client is fully received?
  // IDEA https://nodejs.org/api/net.html#net_socket_byteswritten
  if (timeout !== 0) {
    const timeoutId = setTimeout(() => {
      fnHandler(new Error("Reply timed out"));
    }, timeout);
  }

  sharedcache.pendingRequests[packetId] = fnHandler();

};

// Sends a message to all peers and wait for all to respond
module.exports.messagePeersAndWait = function(payload, callback) {

};




// // Register worker with peers
// // Worker will be triggered by peers
// module.exports.registerWorkerTask = function(payload, callback) {
//   // Payload could contain options like:
//   // Worker name (name)
//   // Worker types (name or null)
//   // Interval (seconds)

//   // Contact all nodes and tell them to stop performing tasks
//   module.exports.messagePeersAndWait({
//     message: "internal__register_task",
//     task: payload.taskname.trim().toLowerCase(),
//     types: payload.types ? payload.types : undefined,
//     interval: payload.interval || 600 // Default 10 minutes
//   }, callback);
// };

// module.exports.unregisterWorkerTask = function(taskname, callback) {
//   // Contact all nodes and tell them to stop performing tasks
//   module.exports.messagePeersAndWait({
//     message: "internal__unregister_task",
//     task: taskname
//   }, callback);
// };
