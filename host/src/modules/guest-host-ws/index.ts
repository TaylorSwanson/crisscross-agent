// We communicate network details to the guest application through this
// interface
// Call the /ws endpoint of the main http server to upgrade

import { Server } from "http";
import url from "url";

import ws from "ws";
import config from "config";

// const sharedcache = require("../sharedcache");
// import * as messager from "../messager";

import wsHandler from "./ws-handler";
import responseFactory from "./responseFactory";


const wss = new ws.Server({ noServer: true });
let wsClients: ws[];

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
  // A client has connected
  ws.on("open", () => {
    console.log("A ws client has connected");
    
    if (typeof wsClients === "undefined") wsClients = [];
    wsClients.push(ws);
  });

  ws.on("message", (message) => {
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message.toString("utf8"));
    } catch (e) {
      console.warn("Could not decode json in ws request:", message);
      
      // Handle error by responding with error
      const response = responseFactory("Could not parse JSON");
      return ws.send(response);
    }

    // Start handling ws messages
    wsHandler(ws, parsedMessage);

  });
});
