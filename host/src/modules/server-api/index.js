// Interface for interacting with the digitalocean API

const child_process = require("child_process");
const path = require("path");
const config = require("config");

if (config.has("useMultipass")) {
  module.exports.getAllServers = function(nodename, callback) {
    // TODO make request to spoof server
  };

  module.exports.createServer = function(config, callback) {
    // TODO make request to spoof server
  }
  return;
}

const digitalocean = require("digitalocean");

const doClient = digitalocean.client(process.env.DOTOKEN);

module.exports.getAllServers = function(nodename, callback) {
  doClient.droplets.list((err, droplets) => {
    if (err) return callback(err);

    console.log("Droplets:", droplets);

    if (!nodename || !nodename.trim.length()) return callback(null, droplets);
    nodename = nodename.toLowerCase().trim();
    // TODO log better?
    // console.log(droplets[0].networks.v4);

    // Filter droplets by cloud name
    callback(null, droplets.filter(d => 
      d.tags.map(t => t.toLowerCase().trim()).includes(nodename))
    );
  });
};
