// This module helps communicate with the peers by offering a server
// Newer peers connect to this server as clients, this server connects as a
// client to older peers

const net = require("net");
const os = require("os");

const config = require("config");

const sharedcache = require("../sharedcache");
const messager = require("../messager");
const messageHandler = require("../../message-handlers");

const packetDecoder = require("xxp").packetDecoder;
const packetFactory = require("xxp").packetFactory;

let server;

const activeSockets = {};

const port = config.get("port");
const hostname = os.hostname().trim().toLowerCase();

module.exports.start = function() {
  console.log("Starting host server", hostname);

  server = net.createServer(socket => {
      
    const connection = socket;

    console.log(`${hostname} - client at ${connection.address().address} connected, \
waiting for identification`);

    // This lets the server handle incoming messages with the message handlers
    packetDecoder(connection, messageHandler);
    
    // Client dropped out
    connection.on("end", () => {
      console.log(`${hostname} - client at ${connection.address().address} ended connection`);

      messager.removeClient({
        socket: connection,
        name: null
      });

      socket.end(null);
    });
  });

  server.on("end", () => {
    console.log(`${hostname} - server ended`);
  });

  server.on("error", err => {
    throw err;
  });

  server.listen(port, () => {
    console.log(`${hostname} - Server bound to`, port);
  });
};

// Removes a client connection
module.exports.dropClient = function(socket, callback) {
  // // Find socket
  // if (!activeSockets.hasOwnProperty(ip))
  //   return console.error("Could not drop non-existent client");
  // const socket = activeSockets[ip];

  // const packet = packetFactory.newPacket({
  //   header: {
  //     type: "internal__connecting_to_you"
  //   },
  //   content: {
  //     yourIp: ip
  //   }
  // });

  // // Send last message to prevent reconnect, acknowledge
  // socket.end(packet, callback);

  // // Remove reference
  // delete activeSockets[ip];
};
