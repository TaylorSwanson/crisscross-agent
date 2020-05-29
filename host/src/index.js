// Main entrypoint for this system
// This application is single-threaded and should be as minimal as possible

const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const path = require("path");

const hostserver = require("./modules/host-server");
const sharedcache = require("./modules/sharedcache");

const packetFactory = require("xxp").packetFactory;

const homedir = os.homedir();
process.chdir(homedir);

// Load the config
const configPath = path.join(homedir, "application", "xx.json");
let instConfig = "";
try {
  instConfig  = fs.readFileSync(configPath);
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
