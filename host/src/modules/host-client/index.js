// This module helps communicate with the peers by connecting to their servers

const net = require("net");
const os = require("os");

const messager = require("../messager");
const sharedcache = require("../sharedcache");

const packetDecoder = require("xxp").packetDecoder;

const hostname = os.hostname().trim().toLowerCase();

module.exports.connectTo = function(host, port, callback) {
  // Connect to a remote server
  const socket = net.createConnection(port, host, () => {
    console.log(`${hostname} - Connected to ${host}:${port}`);
    messager.addClient(socket);
    callback(socket);
  });

  packetDecoder(socket);

  socket.on("end", () => {
    console.log(`${hostname} - Disconnected from ${host}:${port}`);
    // Lost connection, looks intentional (FIN packet sent)
    // We should have received a goodbye message so this shouldn't be an issue
    // TODO verify that we know it's gone
  });

  socket.on("error", err => {
    console.log(err);
    // throw err;
  });

  socket.on("ready", () => {
    console.log(`${hostname} - Ready on ${host}:${port}`);
    // messager.messagePeers({
      
    // });
  });

  socket.on("timeout", () => {
    console.log(`${hostname} - Timeout on ${host}:${port}`);
  });
};
