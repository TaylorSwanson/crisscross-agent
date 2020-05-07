// Passes worker messages to correct handlers

const fs = require("fs");
const path = require("path");
// const log = require("../utils/log");

const handlers = {};
const ignoredFiles = ["index", "headers"];

// Load message handlers
const files = fs.readdirSync(__dirname);
files.forEach(file => {
  const handlerPath = path.join(__dirname, file);
  const handlerStat = fs.statSync(handlerPath);

  // Ignore directories
  if (handlerStat.isDirectory()) return;

  // This is the name of the message that can be called
  const handlerName = path.basename(handlerPath, ".js");
  
  // Ignore blacklisted files
  if (ignoredFiles.includes(handlerName)) return;

  // Save method to the respective handler
  handlers[handlerName] = require(handlerPath);

  console.log(`Registered handler: ${handlerName}`);
});

// Message when there's no registered handlers found
if (Object.getOwnPropertyNames(handlers).length === 0)
  console.log("No message handlers found");

// Call workerHandlers() with payload and the master can send info to workers
// { header, content, stream }
module.exports = function(payload) {
  // Problems
  if (!payload.content)
    return console.error({ payload }, "No payload content sent to handler");
  if (!payload.header)
    return console.error({ payload }, "No payload header sent to handler");
  if (!payload.stream)
    return console.error({ payload }, "No payload stream sent to handler");
  if (!payload.header.hasOwnProperty(type))
    return console.error({ payload }, "Payload header has no message type");
  if (!handlers.hasOwnProperty(payload.header.type))
    return console.error({ payload }, "No handler defined for message type");

  // Parse
  payload.header = JSON.parse(payload.header);
  payload.content = JSON.parse(payload.content);

  // We'll need to reply to the worker with the result of this event
  return handlers[payload.header.type](payload, (err, results) => {
    if (err) return console.error({ err, results }, "Error in worker handler");

    payload.results = results;
    worker.send(payload);
  });
};
