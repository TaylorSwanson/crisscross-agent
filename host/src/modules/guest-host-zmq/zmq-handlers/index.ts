// Loads all handlers and make a function that calls them by name

import fs from "fs";
import path from "path";

import zmq from "zeromq";


const handlers = {};
const ignoredFiles = ["index", "headers", "readme"];

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
  
  // Ignore files
  if (ignoredFiles.includes(handlerName)) return;

  // Save method to the respective handler
  handlers[handlerName] = require(handlerPath);

  console.log(`Registered zmq handler: ${handlerName}`);
});

// Message when there's no registered handlers found
if (Object.getOwnPropertyNames(handlers).length === 0)
  console.log("No zmq message handlers found");

export async function zmqHandlers(sock: zmq.Socket, type: string, message: string) {
  if (!handlers.hasOwnProperty(type)) {
    throw new Error(`No handler exists for message the guest application sent: ${type}`);
  }

  // Trigger handler
  return await handlers[type](sock, message);
}
