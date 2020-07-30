
import os from "os";
import fs from "fs";
import path from "path";
import http from "http";
import child_process from "child_process";

import config from "config";


const hostname = os.hostname();

export default function pair() {
  
  // Get local IP address
  const ifaces = os.networkInterfaces();
  let address = "";

  Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;

    ifaces[ifname].forEach(function (iface) {
      if ("IPv4" !== iface.family || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
      }

      address = iface.address;
    });
  });

  // Send pairing message
  const pairKeyPath = path.join(os.homedir(), ".xxhost", "pairkey");
  const pairKeyPendingPath = path.join(os.homedir(), ".xxhost", "pairkeypending");

  if (fs.existsSync(pairKeyPendingPath)) {
    console.log("Found pending pair key");

    const pairKey = fs.readFileSync(pairKeyPath).toString("utf8").trim();
    const pairKeyResponse = JSON.stringify({
      address,
      hostname,
      pairKey
    });

    let gateway = "";
    if (!process.env.PRODUCTION) {
      // We need to know the default gateway to connect to the API server
      const getGateway = "ip route show | grep 'default' | awk '{print $3}'";
      gateway = child_process.execSync(getGateway).toString("utf8").trim();
    } else {
      gateway = "api.crisscross.app";
    }

    // Make request to spoof server
    const options = {
      method: "post",
      path: "/api-1/hooks/connect",
      host: gateway,
      port: config.get("webPort"),
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': pairKeyResponse.length
      },
      timeout: 5000
    };

    // Options is perfectly valid
    //@ts-ignore
    const req = http.request(options, res => {
      if (res.statusCode !== 201) {
        throw(`Received non-201 status when adding server: ${res.statusCode}`);
      } else {
        console.log(`Authenticated server to project with key ${[pairKey]}`);
      }
    }).on("errpr", err => {
      throw err;
    });

    req.write(pairKeyResponse, (err) => {
      if (err) throw err;

      console.log("Triggered pair webhook");

      req.end();
      req.destroy();
    });

    req.setTimeout(5000);

    req.on("error", () => {});
    req.on("close", () => {});
    req.on("timeout", () => {
      console.log(`Could not connect to pairing webhook (timeout): \
${options.host}:${options.port}${options.path}`);

      console.log("Trying again in 1 minute");
      setTimeout(pair, 1000 * 60);
    });

  }
}
