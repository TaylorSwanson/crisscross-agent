// Interface for interacting with the digitalocean API

const child_process = require("child_process");
const path = require("path");
const config = require("config");

if (config.has("useMultipass")) {
  module.exports.getAllServers = function(nodename, callback) {
    child_process.exec("multipass list --format json", (err, stdout, stderr) => {
      if (err) return callback(err);

      const servers = JSON.parse(stdout).list.map(s => {
        s.ipv4 = s.ipv4[0];
        return s;
      });

      callback(null, servers);
    });
  };

  module.exports.createServer = function(config, callback) {
    // Config is normally digitalocean config stuff
    // We only care about the tag
    const cwd = path.join(__dirname, "../../../../");
    child_process.exec(path.join(cwd, "addNode.sh"), {
      cwd
    }, (err, stdout, stderr) => {
      if (err) return callback(err);

      // Last line is the ip of the new server
      const lines = stdout.trim().split('\n');
      const ipaddr = lines[lines.length-1].trim();
      return callback(null, ipaddr);
    });
  }
  return;
}

const digitalocean = require("digitalocean");

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
