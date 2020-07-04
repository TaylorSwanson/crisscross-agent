// Handles communication with other nodes over TCP
// This works both ways, sending messages to client peers and server peers

import os from "os";

import async from "async";

const xxp = require("xxp");
import sharedcache from "../sharedcache";
import { LooseStringObject } from "xxp";

const hostname = os.hostname().trim().toLowerCase();

// sharedcache.clientConnections = [];
// const clientConnections = sharedcache.clientConnections;
const clientConnections = [];

interface ClientDefinition {
  socket: NodeJS.Socket,
  name: string
};

interface ClientAddresses {
  address: string,
  name: string
};

interface OriginalMessageFormat {
  socket: NodeJS.Socket,
  content,
  header
};

export enum Timeout {
  None = -1
}

// Add a client stream, doesn't matter if it's a server or a client stream
export function addClient(client: ClientDefinition): void {

  if (clientConnections.some(c => c.name === client.name)) {
    return console.warn("Client was already added to the messager:", client.name);
  }

  console.log(`${hostname} - adding client: ${client.name}`);

  clientConnections.push(client);
};

export function removeClient(client: ClientDefinition): void {
  if (typeof client === "undefined") {
    // TODO determine who dropped out
    return console.warn("Cannot remove undefined client");
  }

  // Remove client
  // Assumes that client has already been closed
  // TODO check this; if not, close the connection here
  removeClientByName(client.name);
};

// Returns client by searching for either socket or name
export function getClient(identifier: NodeJS.Socket | string): ClientDefinition {
  if (typeof identifier === "string") {
    // Looking by name
    identifier = identifier.toLowerCase().trim();
    return clientConnections.find(c => c.name === identifier)
  } else {
    // Looking by socket
    return clientConnections.find(c => c.socket == identifier);
  }
};

export function removeClientByName(clientName: string): void {
  const idx = clientConnections.findIndex(c => c.name == clientName);

  if (idx === -1) {
    return console.log("Cannot remove non-existing client:", clientName);
  }

  clientConnections.splice(idx, 1);
};

export function removeClientBySocket(socket: NodeJS.Socket): void {
  const idx = clientConnections.findIndex(c => c.socket == socket);

  if (idx === -1) {
    return console.log("Cannot remove non-existing client with socket:", socket);
  }

  clientConnections.splice(idx, 1);
};

// Get list of all connected ip addresses
export function getAllConnectionAddresses(): ClientAddresses[] {
  return clientConnections.map(c => ({
    address: c.socket.address().address,
    name: c.name
  }));
};

// Sends message to a specfic peer
// If timeout == -1 then it will not time out
// If timeout == 0/undefined/null then it will not time out
// If timeout > 0, the timeout is number of ms

// If timeout is <= 0 then there will be no additional response headers
export function messagePeer(
  socket: NodeJS.Socket,
  type: string,
  payload,
  timeout: number | Timeout,
  callback
): void {

  const packet = xxp.packetFactory.newPacket({
    header: { type, ...payload.header }, content: payload.content
  });
  const packetId = packet.id;

  // console.log(`\n${hostname} - Messaging peer: ${type}`);

  // Check for strange occurrences
  if (sharedcache.pendingRequests.hasOwnProperty(packetId)) {
    console.warn(`${hostname} - Packet id collision (!) : ${packetId}`);
  }

  // console.log(`${hostname} - Sending packet: ${packet.packet.toString("utf8")}`);
  
  // Start sending the packet
  socket.write(packet.packet, function() {
    // console.log(`${hostname} - ${type} packet sent\n`);

    const emptyResult = { header: null, content: null, socket };

    // Determine if we timeout or not
    // If not, we're done when the packet is sent
    if (timeout <= 0) {
      callback(null, emptyResult);
    } else {

      var timeoutId;

      // This handler will be called on reply or timeout regardless
      // It is also responsible for cleaning up
      const fnHandler = (function() {
        return function(err?: Error, sockDetails?: OriginalMessageFormat) {
          clearTimeout(timeoutId);
  
          // Callback would receive (err, { header, content, socket });
          callback(err, emptyResult);
          // Remove this handler to prevent duplicate callbacks
          delete sharedcache.pendingRequests[packetId];
          // Prevent memory leak? (necessary?)
          delete sharedcache.pendingRequestTimeouts[packetId];
        }
      })();
  
      // Save the pending request
      sharedcache.pendingRequests[packetId] = fnHandler;
  
      if (timeout !== -1) {
        // User specified that the message should have a timeout
        // Expire the response on timeout
        timeoutId = setTimeout(() => {
          // "timed out" must be in the error message
          fnHandler(new Error(`${hostname} - Reply timed out: ${type} ${timeout}ms`), emptyResult);
        }, timeout);

        sharedcache.pendingRequestTimeouts[packetId] = timeoutId;
      }
    }

  });
  socket.on("error", err => {
    if (timeout > 0 || timeout === -1) {
      // Need to remove any handler
      delete sharedcache.pendingRequests[packetId];
      delete sharedcache.pendingRequestTimeouts[packetId];
    }
    
    return callback(err);
  });  
};

// Does all the response header work for us
export function replyToPeer(
  originalMessage: OriginalMessageFormat,
  payload,
  timeout: number,
  callback
) {
  messagePeer(originalMessage.socket, "network_reply_generic", {
    header: {
      "xxp__responseto": originalMessage.header["xxp__packetid"],
      ...payload.header
    },
    content: payload.content
  }, timeout, callback);
};


// Sends messages to all connected peers
// Callback will be sent for each peer request made
// If wait == -1 then it will not time out
// If wait == 0/undefined/null then it will not wait
// If wait > 0, the timeout is number of ms to timeout
export function messageAllPeers(
  type: string,
  payload,
  timeout: number,
  callback
): void {
  // console.log(`${hostname} - Messaging all peers:`, clientConnections.length);

  clientConnections.forEach(client => {
    // console.log(`${hostname} - sending one of many to ${client.name} type ${type}`);
    messagePeer(client.socket, type, payload, timeout, callback);
  });
};

export function askAllPeers(
  type: string,
  payload,
  timeout: number,
  callback
): void {
  
};
