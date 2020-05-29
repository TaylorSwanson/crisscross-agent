// Interface for interacting with the digitalocean API

const config = require("config");

if (config.has("useMultipass")) {
  module.exports.getAllServers = function(nodename, callback) {

  };
  return;
}

const DigitalOceanApi = require("digital-ocean-api");

const doApi = new DigitalOceanApi({
  // TODO get this value from the application somewhere
  token: process.env.DOTOKEN
});

module.exports.getAllServers = function(nodename, callback) {
  doApi.listDroplets((err, droplets) => {
    if (err) return callback(new Error("Couldn't reach DigitalOcean api"));

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
