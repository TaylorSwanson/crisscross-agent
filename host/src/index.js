// Main entrypoint for this system
// This application is single-threaded and should be as minimal as possible

const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const path = require("path");

const config = require("config");

const hostserver = require("./modules/host-server");
const ipchost = require("./modules/ipc-host");
const sharedcache = require("./modules/sharedcache");
const serverApi = require("./modules/server-api");

// const packetFactory = require("xxp").packetFactory;

const homedir = os.homedir();
process.chdir(homedir);

// Load the config
let configPath = path.join(homedir, "application", "xx.json");

// Use specific application directory, useful for dev
if (config["XX_APPDIR"] && config.XX_APPDIR) {
  configPath = path.join(process.env.XX_APPDIR, "xx.json");
}

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

// Start IPC server
ipchost.start();


serverApi.getAllServers("", (err, nodes) => {
  console.log(`Found ${nodes.length} peer servers`);
});

serverApi.createServer({}, (err, stdout, stderr) => {
  console.log("Started a new server at", stdout);
});
serverApi.createServer({}, (err, stdout, stderr) => {
  console.log("Started a new server at", stdout);
});
serverApi.createServer({}, (err, stdout, stderr) => {
  console.log("Started a new server at", stdout);
});
serverApi.createServer({}, (err, stdout, stderr) => {
  console.log("Started a new server at", stdout);
});
serverApi.createServer({}, (err, stdout, stderr) => {
  console.log("Started a new server at", stdout);
});
