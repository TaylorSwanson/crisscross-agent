// We communicate network details to the guest application through this
// interface
// Call the /ws endpoint of the main http server to upgrade

import { Server } from "http";
import url from "url";

import ws from "ws";
import config from "config";

// const sharedcache = require("../sharedcache");
// import * as messager from "../messager";

import * as wsHadlers from "./ws-handlers";

const wss = new ws.Server({ noServer: true });

// Start the ws server on the existing http server
export function start(httpServer: Server) {
  httpServer.on("upgrade", (req, socket, head) => {
    const pathname = url.parse(req.url).pathname;
    
    // Call the /ws path to upgrade to websockets for live updates
    if (pathname === "/ws") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    } else {
      // Don't upgrade anything else
      socket.destroy();
    }

  });
};


wss.on("connection", ws => {
  ws.on("message", (message) => {
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message.toString("utf8"));
    } catch (e) {
      console.log("Could not decode json in ws request:", message);
      // Handle error by responding with error
      return ws.send(JSON.stringify({
        status: 0,
        message: "Could not parse JSON"
      }));
    }

    // Handle same requests
    if (parsedMessage.type === "listservers") {
      
    }

  });
});
