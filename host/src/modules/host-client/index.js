// This module helps communicate with the peers by connecting to their servers

const net = require("net");
const os = require("os");

const messager = require("../messager");
const sharedcache = require("../sharedcache");

const packetDecoder = require("xxp").packetDecoder;

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
    console.log(`${hostname} - Error on ${host}:${port}`, err);
    // throw err;
  });

  connection.on("ready", () => {
    console.log(`${hostname} - Ready to talk to ${host}:${port}`);
    
    connection.write(JSON.stringify({
      name: hostname
    }), () => {
      console.log(`${hostname} - Identified to ${host}:${port} as ${hostname}`);
      // We've identified ourselves, wait for an accepted reply
    });
  });

  // This is where the server lets us know if we've been accepted
  let currentBuffer = Buffer.allocUnsafe(0);
  connection.on("data", data => {
    // Build up message
    currentBuffer = Buffer.concat([currentBuffer, data]);

    let message = currentBuffer.toString("utf8");
    
    message = JSON.parse(message);
    
    if (message.status == "accepted") {
      console.log(`${hostname} - server at ${connection.address()} replied: ${message.status}`);
      // This lets the server handle incoming messages with the message handlers
      packetDecoder(connection);

      messager.addClient({
        socket: connection,
        name: message.name
      });

      return;
    }
    
    console.log(`${hostname} - server at ${connection.address()} rejected us: ${message}`);
  });

  connection.on("timeout", () => {
    console.log(`${hostname} - Timeout on ${host}:${port}`);
  });
};
