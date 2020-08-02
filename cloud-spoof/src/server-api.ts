import child_process from "child_process";
import fs from "fs";
import path from "path";

import config from "config";

export function getAllServers(callback) {
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

export function createServer(params, callback) {
  // params is normally digitalocean params stuff
  // We only care about the tag
  const cwd = path.join(__dirname, "../../");
  child_process.exec(path.join(cwd, "addNode.sh"), { cwd },
  (err, stdout, stderr) => {
    if (err) return callback(err);

    // Last line is the ip of the new server
    const lines = stdout.trim().split('\n');
    const words = lines[lines.length-1].trim().split(" ");

    const ipaddr = words[0].trim();
    const name = words[1].trim();

    // Vars to join network
    const pairKey = config.get("pairKey");
    const dotoken = config.get("dotoken");

    // Add xxhost to server and start it
    child_process.exec(path.join(cwd, "updateNodes.sh"), (err, stdout, stderr) => {
      if (err) return callback(err, stdout, stderr);
      // @ts-ignore
      child_process.exec(path.join(cwd, "startSingleNode.sh", [name, pairKey, dotoken]), (err, stdout, stderr) => {
        if (err) return callback(err, stdout, stderr);

        callback(null, {
          ipv4: ipaddr,
          name
        });
      });
    });
  });
};
