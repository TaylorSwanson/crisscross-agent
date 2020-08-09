// This server only runs on seed nodes
// Otherwise we'd use more memory than needed

import config from "config";
import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

import routeFactory from "./routeFactory";

export function start() {
  const port: number = config.get("seedPort");

  // Initialize express for this worker
  const app = express();
  // Remove powered-by header
  app.set("x-powered-by", false);
  // Configure app to support client-provided cookies
  app.use(cookieParser());
  // Configure app to support message bodies with different encodings
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  
  app.use(require("./middleware/LoggerMiddleware"));
  
  // Load routes
  app.use(routeFactory(__dirname));


  // NOTE by nature, requests sent over this channel are not secure
  // All secure communication is over webhooks to the UI API servers
  app.listen(port);

  console.log(`Started seed server on port ${config.get("seedPort")}`);
};
