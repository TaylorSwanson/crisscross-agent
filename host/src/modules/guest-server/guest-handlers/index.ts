// Loads all handlers and make a function that calls them by name

import fs from "fs";
import path from "path";

import net from "net";


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

  console.log(`Registered guest handler: ${handlerName}`);
});

// Message when there's no registered handlers found
if (Object.getOwnPropertyNames(handlers).length === 0)
  console.log("No guest message handlers found");


export default function(socket: net.Socket, message: string) {
  if (!handlers.hasOwnProperty(message)) {
    throw new Error(`No handler exists for message the guest application sent: ${message}`);
  }

  // Trigger handler
  return handlers[message](socket);
}
