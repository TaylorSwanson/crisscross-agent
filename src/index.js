// Main entrypoint for this system

const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const path = require("path");

const hostserver = require("./modules/host-server");
const memcache = require("./modules/memcache");

const packetFactory = require("./utils/static/packetFactory");

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
    console.log("Config file not found at adhoc.json:", configPath);
  } else {
    throw err;
  }
}

// Store the adhoc.json config
const keys = Object.keys(instConfig);
keys.forEach(key => {
  memcache[key] = instConfig.key;
});

// Give this instance a random name for the process (not hostname)
memcache["processid"] = crypto.randomBytes(5).toString("hex");

// Init server setup
// TODO load server layout with DOAPI
hostserver.start();


packetFactory.newPacket({
  header: {
    type: "internal__connecting_to_you"
  },
  content: {
    yourIp: "asdf"
  }
});
