// We communicate network details to the guest application through this
// interface
// Call the /ws endpoint of the main http server to upgrade

import url from "url";

import zmq from "zeromq";
import config from "config";

import { responseBuilder } from "./responseFactory";

import { zmqHandlers } from "./zmq-handlers";

const pubsubSock = new zmq.Publisher;
const reqresSock = new zmq.Reply;
const events = pubsubSock.events;
let isBound = false;

// Start the ws server on the existing http server
export async function start() {
  await pubsubSock.bind(`tcp://127.0.0.1:${config.get("port")}`);
  await reqresSock.bind(`tcp://127.0.0.1:${config.get("reqPort")}`);
  isBound = true;

  // Listen for requests from host app
  for await (const [type, msg] of reqresSock) {
    // Use zmq-handlers to route message to the right method
    await zmqHandlers(reqresSock, type.toString(), msg.toString());
  }
};



// Sends a message to all listeners
// Typically this is just the one application, but multiple codebases can be
// listening on this one server
export async function sendToAll(type: string, err: string, payload: object) {
  if (!isBound)
    throw new Error("Cannot send message over socket - start server first");

  return pubsubSock.send([type, responseBuilder(err, payload)]);
};
