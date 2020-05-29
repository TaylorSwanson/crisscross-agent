// Interface for interacting with the digitalocean API

const child_processs = require("child_processs");
const config = require("config");

if (config.has("useMultipass")) {
  module.exports.getAllServers = function(nodename, callback) {
    child_processs.exec("multipass list --format json", (err, stdout, stderr) => {
      if (err) return callback(err);

      const servers = JSON.parse(stdout);

      callback(null, servers);
    });
  };
  return;
}

const DigitalOceanApi = require("digitalocean");

const doClient = digitalocean.client(process.env.DOTOKEN);

module.exports.getAllServers = function(nodename, callback) {
  doClient.droplets.list((err, droplets) => {
    if (err) return callback(new Error("Couldn't reach DigitalOcean api"));

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
