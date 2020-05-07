// Interface for interacting with the digitalocean API

const config = require("config");

if (config.has("useMultipass")) {
  module.exports.getAllServers = function(cloudname, callback) {

  };
  return;
}

const DigitalOceanApi = require("digital-ocean-api");

const doApi = new DigitalOceanApi({
  token: process.env.DOTOKEN
});

module.exports.getAllServers = function(cloudname, callback) {
  doApi.listDroplets((err, droplets) => {
    if (err) return console.error("Couldn't reach DigitalOcean api");
    // TODO log better?
    // console.log(droplets[0].networks.v4);

    // Filter droplets by cloud name
    callback(droplets.filter(d => d.tags.includes(cloudname)));
  });
};
