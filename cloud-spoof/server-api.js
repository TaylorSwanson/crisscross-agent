const child_process = require("child_process");
const fs = require("fs");
const path = require("path");

module.exports.getAllServers = function(callback) {
  child_process.exec("multipass list --format json", (err, stdout, stderr) => {
    if (err) return callback(err);

    const servers = JSON.parse(stdout).list.map(s => {
      s.address = s.ipv4[0];
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

    // Add xxhost to server and start it
    child_process.exec(path.join(cdw, "updateNodes.sh"), (err, stdout, stderr) => {
      if (err) return callback(err, stdout, stderr);
      child_process.exec(path.join(cdw, "startSingleNode.sh", [name]), (err, stdout, stderr) => {
        if (err) return callback(err, stdout, stderr);

        callback(null, {
          ipv4: ipaddr,
          name
        });
      });
    });
  });
};
