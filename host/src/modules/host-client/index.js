// This module helps communicate with the peers by connecting to their servers

const net = require("net");
const os = require("os");

const sharedcache = require("../sharedcache");
const messager = require("../messager");
const messageHandler = require("../../message-handlers");

const packetDecoder = require("xxp").packetDecoder;
const packetFactory = require("xxp").packetFactory;

const hostname = os.hostname().trim().toLowerCase();

module.exports.connectTo = function(host, port, callback) {
  // Connect to a remote server
  const connection = net.createConnection(port, host, () => {
    console.log(`${hostname} - Connecting to ${host}:${port}`);
  });

  connection.on("end", () => {
    console.log(`${hostname} - Disconnected from ${host}:${port}`);
    // Lost connection, looks intentional (FIN packet sent)
    // We should have received a goodbye message so this shouldn't be an issue
    // TODO verify that we know it's gone
  });

  connection.on("error", err => {
    if (err.code == "ECONNREFUSED") {
      return console.log(`${hostname} - Not available as host: ${host}:${port}`);
    }
    console.log(`${hostname} - Error on ${host}:${port}`, err);
  });

  connection.on("ready", () => {
    console.log(`${hostname} - Ready to talk to ${host}:${port}`);

    const packet = packetFactory.newPacket({
      header: {
        type: "network_handshake_identify"
      },
      content: {
        name: hostname
      }
    }).packet;
    
    connection.write(packet, () => {
      console.log(`${hostname} - Identified to ${host}:${port} as ${hostname}`);
      // We've identified ourselves, wait for an accepted reply
    });
  });


  // This is where the server lets us know if we've been accepted
  packetDecoder(connection, res => {
    const message = JSON.parse(res.content);
    if (message.status == "accepted") {
      console.log(`${hostname} - server at ${connection.address().address} replied: ${message.status}`);
      // This lets the server handle incoming messages with the message handlers
      packetDecoder(connection, messageHandler);

      messager.addClient({
        socket: connection,
        name: message.name
      });

      return;
    }
    
    console.log(`${hostname} - server at ${connection.address().address} rejected us: ${message}, ${typeof message}`);
  });

  connection.on("timeout", () => {
    console.log(`${hostname} - Timeout on ${host}:${port}`);
  });
};
