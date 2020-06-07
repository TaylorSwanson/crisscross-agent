// Main entrypoint for this system
// This application is single-threaded and should be as minimal as possible

import "source-map-support/register";

import fs from "fs";
import os from "os";
import crypto from "crypto";
import path from "path";
// const child_process = require("child_process");

import config from "config";

import hostserver from "./modules/host-server";
import sharedcache from "./modules/sharedcache";
import * as hostclient from "./modules/host-client";
import * as guesthost from "./modules/guest-host";
import * as serverApi from "./modules/server-api";
import * as aliveWatcher from "./modules/alive-watcher";
import * as groupTimer from "./modules/group-timer";

// const packetFactory = require("xxp").packetFactory;

const homedir = os.homedir();
const hostname = os.hostname().trim().toLowerCase();
process.chdir(homedir);

// Load the config
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
// TODO load server layout with DOAPI
hostserver.start();

serverApi.getAllServers("", (err, nodes) => {
  console.log(`Found ${nodes.length} servers:`, nodes);
  let connectablePeers = nodes.filter(n => n.hasOwnProperty("ipv4"));

  // Filter ourselves
  connectablePeers = connectablePeers.filter(n => n.name != hostname);

  console.log(`Of those servers, ${connectablePeers.length} are connectable`);

  // Connect as client to existing servers
  connectablePeers.forEach(p => {
    //@ts-ignore
    hostclient.connectTo(p.ipv4, config.port, () => {});
  });
});


// Start the host that the guest application can connect to
guesthost.start();
// Start keepalive watcher
groupTimer.randomTimer("alive", 60, 10, aliveWatcher.keepAliveFunction);
