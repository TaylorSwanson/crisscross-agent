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
  server = net.createServer(socket => {
    // This lets the server handle incoming messages with the message handlers
    packetDecoder(socket, messageHandler);

    messager.addClient(socket);

    socket.on("end", () => {
      // Lost connection, looks intentional (FIN packet sent)
      // We should have received a goodbye message so this shouldn't be an issue
    });

    socket.on("ready", () => {
      console.log(`${hostname} - Host server ready`);
      // Store reference to socket
      // const address = socket.address();
      // activeSockets[address.address] = socket;
    });

    socket.on("connection", socket => {
      console.log(`${hostname} - Socket connected`);
    });
  });

  server.on("error", err => {
    throw err;
  });

  server.listen(port, () => {
    console.log(`Server bound to ${port}`);
  });
};

// Removes a client connection
module.exports.dropClient = function(ip, callback) {
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

  messager.removeClient(socket);

  socket.end(null, callback);

  // Remove reference
  delete activeSockets[ip];
};
