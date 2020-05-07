// This module helps communicate with the peers by connecting to their servers

const net = require("net");

const messager = require("../messager");

const packetDecoder = require("../../utils/static/packetDecoder");


module.exports.createConnection = function(host, port, callback) {
  // Connect to a remote server
  const client = net.createConnection(port, host, () => {
    console.log(`Connected to ${host}:${port}`);
    messager.addClient(client);
    callback(client);
  });

  packetDecoder(client);

  client.on("end", () => {
    console.log(`Disconnected from ${host}:${port}`);
    // Lost connection, looks intentional (FIN packet sent)
    // We should have received a goodbye message so this shouldn't be an issue
    // TODO verify that we know it's gone
  });

  client.on("error", err => {
    throw err;
  });

  stream.on("ready", () => {
    // messager.messagePeers({
      
    // });
  });
};
