const child_process = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports.getAllServers = function(callback) {
  child_process.exec("multipass list --format json", (err, stdout, stderr) => {
    if (err) return callback(err);

    const servers = JSON.parse(stdout).list.map(s => {
      s.ipv4 = s.ipv4[0];
      delete s.release;
      delete s.state;
      return s;
    });

    callback(null, servers);
  });
};

function setTag(nodeName, tag) {
  const mountDir = path.join(__dirname, "../dev-mounts/", nodeName.toLowerCase);
  fs.writeFileSync(path.join(mountDir, "tag"), tag);
}

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
