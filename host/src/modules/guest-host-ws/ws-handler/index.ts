// Passes websocket messages to correct handlers

import fs from "fs";
import path from "path";
import os from "os";

import ws from "ws";


import responseFactory from "../responseFactory";


const hostname = os.hostname().trim().toLowerCase();

const handlers = {};
const ignoredFiles = ["index"];

// Load message handlers
const files = fs.readdirSync(__dirname);
files.forEach(file => {
  const handlerPath = path.join(__dirname, file);
  const handlerStat = fs.statSync(handlerPath);

  // Ignore directories
  if (handlerStat.isDirectory()) return;

  // Ignore map files
  if (handlerPath.endsWith(".map")) return;

  // This is the name of the message that can be called
  const handlerName = path.basename(handlerPath, ".js");
  
  // Ignore blacklisted files
  if (ignoredFiles.includes(handlerName)) return;

  // Save method to the respective handler
  handlers[handlerName] = require(handlerPath);

  console.log(`Registered ws handler: ${handlerName}`);
});

// Message when there's no registered handlers found
if (Object.getOwnPropertyNames(handlers).length === 0)
  console.log("No ws message handlers found");


// Send messages to the appropriate handlers
export default function(ws: ws, payload) {
  // Problems
  if (payload.status === 0) {
    return console.error(`${hostname} - received error packet from ws:`, payload);
  }
  if (!payload.header.hasOwnProperty("type")) {
    const msg = "Payload header has no message type";

    const response = responseFactory(msg);
    ws.send(response);

    return console.error({ payload }, `${hostname} - ${msg}`);
  }
  if (!handlers.hasOwnProperty(payload.header.type)) {
    const msg = `No handler defined for message type "${payload.header.type}". \
See CrissCross guest API docs for supported handlers.`;
    
    const response = responseFactory(msg);
    ws.send(response);

    return console.error({ payload }, `${hostname} - ${msg}`);
  }

  if (typeof handlers[payload.header.type] !== "function") {
    const msg = "Internal CrissCross handler is not a function";
    
    const response = responseFactory(msg);
    ws.send(response);

    return console.error({ handler: handlers[payload.header.type] }, `${hostname} - ${msg}`);
  }

  // We'll need to reply to the worker with the result of this event
  // console.log(`${hostname} - Calling handler for`, payload.header.type);
  return handlers[payload.header.type](ws, payload, (err: Error, type: string, results) => {
    if (err) {
      const msg = `${hostname} - Error in CrissCross worker handler`;
    
      const response = responseFactory(msg);
      ws.send(response);

      return console.error({ err, results }, msg);
    }
    
    // Send the result to the client app
    const response = responseFactory(null, {
      ...results,
      header: { type }
    });

    ws.send(response);
  });
};
