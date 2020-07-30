// Interface for interacting with the digitalocean API

import child_process from "child_process";
import http from "http";
import os from "os";

import config from "config";

import * as digitalocean from "digitalocean";
import pair from "./pair";

// This is valid in the linux multipass servers
const getGateway = "ip route show | grep 'default' | awk '{print $3}'";
const hostname = os.hostname();

let doClient: any;
if (!config.has("useMultipass")) {
  doClient = digitalocean.client(process.env.DOTOKEN);
}

export function getAllPeers(nodename: string, callback: Function) {
  if (config.has("useMultipass")) {
    // We need to know the default gateway to connect to the spoof server
    const gateway = child_process.execSync(getGateway).toString("utf8").trim();

    // Make request to spoof server
    const options = {
      method: "GET",
      path: "/servers",
      host: gateway,
      port: 3334,
      timeout: 5000
    };

    http.get(options, res => {
      if (res.statusCode !== 200) {
        callback(`Received non-200 status when querying for servers: ${res.statusCode}`);

        // Consume response data to free up memory
        res.resume();
        return;
      }

      let data = "";

      res.on("data", chunk => {
        data += chunk;
      });

      res.on("end", () => {
        callback(null, JSON.parse(data));
      });
    }).on("timeout", err => {
      callback("Server list request timed out - is the DO cloud-spoof server running?");
    }).on("error", err => {
      if (err.message.indexOf("ETIMEDOUT") !== -1) return; // Prevent duplicate timeout messages
      callback(`Error with server list request: ${err}`);
    });
  } else {

    doClient.droplets.list((err, droplets) => {
      if (err) return callback(err);

      console.log("Droplets:", droplets);

      if (!nodename || !nodename.trim().length) return callback(null, droplets);
      nodename = nodename.toLowerCase().trim();
      // TODO log better?
      // console.log(droplets[0].networks.v4);

      // Filter droplets by cloud name
      callback(null, droplets.filter(d => 
        d.tags.map(t => t.toLowerCase().trim()).includes(nodename))
      );
    });

  }
};

export function createServer(config, callback) {
  if (config.has("useMultipass")) {
    // We need to know the default gateway to connect to the spoof server
    const gateway = child_process.execSync(getGateway).toString("utf8").trim();
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
  } else {
    
    // TODO Use DO API to create the server
  }
};

export function start() {
  pair();
};
