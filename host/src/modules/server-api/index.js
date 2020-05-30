// Interface for interacting with the digitalocean API

const child_process = require("child_process");
const http = require("http");
const path = require("path");

const config = require("config");


if (config.has("useMultipass")) {
  // We need to know the default gateway to connect to the spoof server
  const getGateway = "ip route show | grep 'default' | awk '{print $3}'";
  const gateway = child_process.execSync(getGateway).toString("utf8").trim();

  module.exports.getAllServers = function(nodename, callback) {
    // Make request to spoof server
    http.get(`http://${gateway}:3334/servers`, (res) => {
      let data = "";

      res.on("data", chunk => {
        data += chunk;
      });

      res.on("end", () => {
        callback(null, JSON.parse(data));
      })
    }).on("error", (err) => { callback(err) });
  };

  module.exports.createServer = function(config, callback) {
    // Make request to spoof server

    const data = JSON.stringify(config);

    const options = {
      method: "POST",
      hostname: gateway,
      port: 3334,
      path: "/servers",
      timeout: 0,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length
      }
    };


    const req = http.request(`http://${gateway}:3334/servers`, options, (res) => {
      let data = "";

      res.on("data", chunk => {
        data += chunk;
      });

      res.on("end", () => {
        callback(null, JSON.parse(data));
      })
    });

    req.on("error", (err) => { callback(err) })
    req.write(data);
    req.end();
  };


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
