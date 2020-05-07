// Handles communication with other nodes over TCP
// This works both ways, sending messages to client peers and server peers

const packetFactory = require("../../utils/static/packetFactory");


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
// Callback throws error if peers are unreachable
module.exports.messagePeers = function(payload, callback) {
  // Message to send:
  const packet = packetFactory.newPacket({ content: payload });
  clientConnections.forEach(client => {
    client.write(packet);
  });
};

// Sends message to a specfic peer
module.exports.messagePeer = function(payload, callback) {

};

// Sends a message to all peers and wait for all to respond
module.exports.messagePeersAndWait = function(payload, callback) {

};




// Register worker with peers
// Worker will be triggered by peers
module.exports.registerWorkerTask = function(payload, callback) {
  // Payload could contain options like:
  // Worker name (name)
  // Worker types (name or null)
  // Interval (seconds)

  // Contact all nodes and tell them to stop performing tasks
  module.exports.messagePeersAndWait({
    message: "internal__register_task",
    task: payload.taskname.trim().toLowerCase(),
    types: payload.types ? payload.types : undefined,
    interval: payload.interval || 600 // Default 10 minutes
  }, callback);
};

module.exports.unregisterWorkerTask = function(taskname, callback) {
  // Contact all nodes and tell them to stop performing tasks
  module.exports.messagePeersAndWait({
    message: "internal__unregister_task",
    task: taskname
  }, callback);
};
