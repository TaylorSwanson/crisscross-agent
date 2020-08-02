// Interface for interacting with the digitalocean API
// This runs on the seed server so we can use axios here

import child_process from "child_process";
import os from "os";

import config from "config";
import axios from "axios";

import pair from "./pair";

// This is valid in the linux multipass servers
const getGateway = "ip route show | grep 'default' | awk '{print $3}'";
const hostname = os.hostname();

export function getAllPeers(nodename: string, callback: Function) {
  if (config.has("useMultipass")) {
    // We need to know the default gateway to connect to the spoof server
    const gateway = child_process.execSync(getGateway).toString("utf8").trim();

    axios.get(`http://${gateway}:3334/servers`, { timeout: 1000 }).then(response => {
      callback(null, response.data);
    }, err => callback(err));

  } else {

    // TODO use authenticated request to digitalocean

  }
};

export function createServer(params, callback) {
  if (config.has("useMultipass")) {

    // We need to know the default gateway to connect to the spoof server
    const gateway = child_process.execSync(getGateway).toString("utf8").trim();
    // Make request to spoof server
    axios.post(`http://${gateway}:3334/servers`, {
      pairKey: params.pairKey,
      dotoken: params.dotoken
    }, { timeout: 1000 }).then(response => {
      callback(null, response.data);
    }, err => callback(err));
  } else {
    
    // TODO Use DO API to create the server

  }
};

export function start() {
  pair();
};
