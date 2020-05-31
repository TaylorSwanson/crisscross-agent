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

    console.log(`${hostname} - client just connected`);

    socket.on("ready", () => {
      
      const connection = socket;

      console.log(`${hostname} - client at ${connection.address()} connected, \
      waiting for identification`);

      // This is where the client identifies themselves
      let currentBuffer = Buffer.allocUnsafe(0);
      connection.on("data", data => {
        console.log("Data", data);
        // Build up message
        currentBuffer = Buffer.concat([currentBuffer, data]);

        let message = currentBuffer.toString("utf8");
        console.log(`${hostname} - client at ${connection.address()} identified \
        as ${message}`);

        message = JSON.parse(message);

        // This lets the server handle incoming messages with the message handlers
        packetDecoder(connection, messageHandler);

        messager.addClient({
          socket: connection,
          name: message.name
        });
        
        // Let client know that we are accepting messages now
        connection.write(JSON.stringify({
          status: "accepted"
        }), () => {
          console.log(`${hostname} - client at ${connection.address()} accepted`);
        });

      });
      
      // Client dropped out
      connection.on("end", () => {
        console.log(`${hostname} - client at ${connection.address()} ended connection`);

        messager.removeClient(connection);
        socket.end(null, callback);
      });
    });

    socket.on("end", () => {
      console.log(`${hostname} - we ended the server connection?`);
    });

    socket.on("connect", connection => {
      
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
