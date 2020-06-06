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
    console.log(`${hostname} - connecting to ${host}:${port}`);
  });

  connection.on("end", () => {
    console.log(`${hostname} - disconnected from ${host}:${port}`);
    // Lost connection, looks intentional (FIN packet sent)
    // We should have received a goodbye message so this shouldn't be an issue
    // TODO verify that we know it's gone
  });

  connection.on("error", err => {
    if (err.code == "ECONNREFUSED") {
      return console.log(`${hostname} - not available as host: ${host}:${port}`);
    }
    console.log(`${hostname} - error on ${host}:${port}`, err);
  });

  connection.on("ready", () => {
    console.log(`${hostname} - ready to talk to ${host}:${port}`);

    const packet = packetFactory.newPacket({
      header: {
        type: "network_handshake_identify"
      },
      content: {
        name: hostname
      }
    }).packet;
    
    connection.write(packet, () => {
      console.log(`${hostname} - identified to ${host}:${port}`);
      // We've identified ourselves, wait for an accepted reply
    });
  });

  // This lets the server handle incoming messages with the message handlers
  packetDecoder(connection, messageHandler);

  connection.on("timeout", () => {
    console.log(`${hostname} - timeout on ${host}:${port}`);
  });
};
