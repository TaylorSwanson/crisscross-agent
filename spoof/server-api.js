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
    const ipaddr = lines[lines.length-1].trim();
    return callback(null, ipaddr);
  });
}
