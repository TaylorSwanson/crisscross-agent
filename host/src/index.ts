// Main entrypoint for this system
// This application is single-threaded and should be as minimal as possible

import "source-map-support/register";

import fs from "fs";
import os from "os";
import crypto from "crypto";
import path from "path";
// const child_process = require("child_process");

import config from "config";

import * as hostserver from "./modules/host-server";
import sharedcache from "./modules/sharedcache";
import * as hostclient from "./modules/host-client";
import * as guesthosthttp from "./modules/guest-host-http";
import * as guesthostws from "./modules/guest-host-ws";
import * as serverApi from "./modules/server-api";
import * as aliveWatcher from "./modules/alive-watcher";
import * as groupTimer from "./modules/group-timer";

// const packetFactory = require("xxp").packetFactory;

// Operate out of the home directory of the server
const homedir = os.homedir();
const hostname = os.hostname().trim().toLowerCase();
process.chdir(homedir);

// Load the config from the designated application directory
let configPath = path.join(homedir, "application", "xx.json");

// Use specific application directory, useful for dev
//@ts-ignore
if (config["XX_APPDIR"] && config.XX_APPDIR.length) {
  configPath = path.join(process.env.XX_APPDIR, "xx.json");
}

let instConfig = "";
try {
  instConfig = fs.readFileSync(configPath).toString("utf8");
} catch (err) {
  if (err.code === "ENOENT") {
    // TODO log to a more recognizable location
    console.log("Config file not found at xx.json:", configPath);
  } else {
    throw err;
  }
}

// Store the xx.json config
const keys = Object.keys(instConfig);
keys.forEach(key => {
  sharedcache[key] = instConfig[key];
});

// Give this instance a random name for the process (not hostname or actual PID)
sharedcache["processid"] = crypto.randomBytes(4).toString("hex");

// Init server setup
hostserver.start();

// This gets peers from multipass or the DO API, depending on environment
// This can fail locally if the spoof server isn't running
// It can fail in prod if the DO API is unavailable
// If DOAPI lists no servers but no err, then we'll wait for clients (we're alone)
// If we get an error we will indefinitely retry asking the API for peers
function tryGettingPeers() {
  serverApi.getAllPeers("", (err, nodes) => {
    if (err) {
      console.error(`${hostname} - Could not list peers:`, err);
      console.log(`${hostname} - Retrying in 5 minutes since the API seems to be down`);
  
      return setTimeout(tryGettingPeers, 1000 * 60 * 5);
    }
  
    console.log(`${hostname} - Found ${nodes.length} servers:`, nodes);
    let connectablePeers = nodes.filter(n => n.hasOwnProperty("ipv4"));
  
    // Filter ourselves out
    connectablePeers = connectablePeers.filter(n => n.name != hostname);
  
    console.log(`${hostname} - Of those servers, ${connectablePeers.length} are connectable`);
  
    // Connect as client to existing servers
    connectablePeers.forEach(p => {
      //@ts-ignore
      hostclient.connectTo(p.ipv4, config.port, () => {});
    });
  });
}

// Recursively attempt to check for servers
// If the API is down it will continue to check until there is no error
tryGettingPeers();

// Start the http host that the guest application can connect to
const httpServer = guesthosthttp.start();
// Start the ws host that the guest application can connect to
guesthostws.start(httpServer);

// Start keepalive watcher
groupTimer.randomTimer("alive", 60, 10, aliveWatcher.keepAliveFunction);
