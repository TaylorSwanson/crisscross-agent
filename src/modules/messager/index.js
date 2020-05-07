// Handles communication with other nodes

const packetFactory = require("../../utils/static/packetFactory");


const clientStreams = [];


module.exports.addClient = function(client) {
  clientStreams.push(client);
};

module.exports.removeClient = function(client) {
  const idx = clientStreams.indexOf(client);
  if (idx === -1) {
    return console.log("Cannot remove non-existing client:", client);
  }

  // Remove client
  // Assumes that client has already been closed
  // TODO check this, if not close the connection here
  clientStreams.splice(idx, 1);
};

module.exports.messagePeers = function(payload, callback) {

};

module.exports.messagePeer = function(payload, callback) {

};

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
