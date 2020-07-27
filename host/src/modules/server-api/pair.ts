
import os from "os";
import fs from "fs";
import path from "path";
import http from "http";
import child_process from "child_process";

import config from "config";


const hostname = os.hostname();
const getGateway = "ip route show | grep 'default' | awk '{print $3}'";

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
  if (fs.existsSync(pairKeyPath)) {
    const pairKey = fs.readFileSync(pairKeyPath).toString("utf8").trim();
    const pairKeyResponse = JSON.stringify({
      address,
      hostname,
      pairKey
    });

    // TODO make http request to server webhook at gateway
    // We need to know the default gateway to connect to the spoof server
    const gateway = child_process.execSync(getGateway).toString("utf8").trim();

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

      req.end();
      req.destroy();
    });

    // Delete the file so we don't auth again
    fs.unlinkSync(pairKeyPath);

  }
}
