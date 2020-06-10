// We communicate network details to the guest application through this interface
// This only provides the most basic support
// The majority of communication is done over websockets

import express from "express";
import bodyParser from "body-parser";
import config from "config";

const app = express();

// const sharedcache = require("../sharedcache");
import * as messager from "../messager";
import { Server } from "http";

// This port needs to be the same as the port that is used in api-spoof
const port = config.get("internalPort");

// Configure app to support message bodies with different encodings
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Log requests
app.use((req, res, next) => {
  console.log(`${Date.now()}: ${req.method} ${req.url}`);
  next();
});

// Default info route
app.get("/", (req, res, next) => {
  res.status(200).send("Guest API is working, call this API from your application");
});

// List servers in network
// This doesn't query the network but uses the server's active connection list
app.get("/servers", (req, res, next) => {
  const servers = messager.getAllConnectionAddresses();
  res.status(200).json(servers);
});

// The "/ws" endpoint is used to upgrade to websocket server
// call with "ws://<localhost>:<config internalPort>/ws"

export function start(): Server {
  const server = app.listen(port);
  
  console.log("CrissCross guest API running on port", port);
  return server;
};
