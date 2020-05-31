const child_process = require("child_process");
const fs = require("fs");
const path = require("path");

// This is a dev environment so sync functions are fine here
function setTag(nodeName, tag) {
  const mountDir = path.join(__dirname, "../dev-mounts/", nodeName.toLowerCase());
  fs.writeFileSync(path.join(mountDir, "tag"), tag);
}
function getTag(nodeName) {
  const mountDir = path.join(__dirname, "../dev-mounts/", nodeName.toLowerCase());
  return fs.readFileSync(path.join(mountDir, "tag")).toString("utf8");
}

module.exports.getAllServers = function(callback) {
  child_process.exec("multipass list --format json", (err, stdout, stderr) => {
    if (err) return callback(err);

    const servers = JSON.parse(stdout).list.map(s => {
      s.ipv4 = s.ipv4[0];
      s.type = getTag(s.name);
      delete s.release;
      delete s.state;
      return s;
    });

    callback(null, servers);
  });
};

module.exports.createServer = function(config, callback) {
  // Config is normally digitalocean config stuff
  // We only care about the tag
  const cwd = path.join(__dirname, "../");
  child_process.exec(path.join(cwd, "addNode.sh"), {
    cwd
  }, (err, stdout, stderr) => {
    if (err) return callback(err);

    // Last line is the ip of the new server
    const lines = stdout.trim().split('\n');
    const words = lines[lines.length-1].trim().split(" ");

    const ipaddr = words[0].trim();
    const name = words[1].trim();

    if (config.tag) setTag(name, config.tag)
    
    return callback(null, {
      ipv4: ipaddr,
      name
    });
  });
};
