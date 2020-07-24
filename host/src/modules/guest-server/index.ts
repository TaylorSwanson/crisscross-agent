// We communicate network details to the guest application through this
// interface


import net, { Server } from "net";
import os from "os";

import config from "config";

import responseBuilder from "./responseBuilder";

import guestHandlers from "./guest-handlers";

let isBound = false;
let server: Server;

const port = config.get("port");
const hostname = os.hostname().trim().toLowerCase();

export function start() {
  console.log(`${hostname} - Starting guest server`, hostname);

  server = net.createServer(socket => {
    console.log(`${hostname} - A guest connected`);
    // A guest application connected
    
    let currentBuffer = Buffer.alloc(0);
    socket.on("data", (data: Buffer) => {
      // We execute once a newline has been received
      currentBuffer = Buffer.concat([currentBuffer, data]);

      // Split messages by newlines
      if (currentBuffer.includes('\n')) {
        // Done with message
        const messages = currentBuffer.toString().split('\n');
        guestHandlers(socket, messages[0]);
        // If part of a next message is in this data, start with that
        if (messages.length > 1) {
          // Prefill with next message content
          currentBuffer = Buffer.from(messages[1]);
        } else {
          // Reset buffer
          currentBuffer = Buffer.alloc(0);
        }
      }

    });
  });

  server.on("end", () => {
    console.log(`${hostname} - server ended`);
  });

  server.on("error", err => {
    throw err;
  });

  server.listen(port, () => {
    console.log(`${hostname} - Guest server bound to`, port);
  });
};


// Sends a message to all listeners
// Typically this is just the one application, but multiple codebases can be
// listening on this one server
export function sendToAll(type: string, err: string, payload: object) {
  if (!isBound)
    throw new Error("Cannot send message over socket - start server first");

  
};
