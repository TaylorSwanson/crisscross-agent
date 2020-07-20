// Loads all handlers and make a function that calls them by name

import zmq from "zeromq";


const handlers = {};

export async function zmqHandlers(sock: zmq.Socket, type: string, message: string) {
  if (!handlers.hasOwnProperty(type)) {
    throw new Error(`No handler exists for message the guest application sent: ${type}`);
  }

  
}
