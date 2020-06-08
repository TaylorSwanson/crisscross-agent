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

export function removeClientByName(clientName: string) {
  const idx = clientConnections.findIndex(c => c.name == clientName);

  if (idx === -1) {
    return console.log("Cannot remove non-existing client:", clientName);
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
// TODO switch wait param with options obj
export function messagePeer(
  socket: NodeJS.Socket,
  type: string,
  payload,
  timeout: number,
  callback
): void {

  const packet = xxp.packetFactory.newPacket({
    header: { type, ...payload.header }, content: payload.content
  });
  const packetId = packet.id;

  console.log("Messaging peer:", type);

  // Check for strange occurrences
  if (sharedcache.pendingRequests.hasOwnProperty(packetId)) {
    console.warn(`Packet id collision (!) : ${packetId}`);
  }

  // Start sending the packet
  socket.write(packet.packet, function() {
    // Determine if we timeout or not
    // If not, we're done when the packet is sent
    if (!(timeout > 0)) {
      return callback(...arguments);
    } else if (timeout > 0) {

      // This handler will be called on reply or timeout regardless
      // It is also responsible for cleaning up after itself
      const fnHandler = (function() {
        return function(err?: Error) {
          clearTimeout(timeoutId);
  
          // Callback would receive (err, { header, content, socket });
          callback(...arguments);
          // Remove this handler to prevent duplicate callbacks
          delete sharedcache.pendingRequests[packetId];
          // Prevent memory leak? (necessary?)
          delete sharedcache.pendingRequestTimeouts[packetId];
        }
      })();
  
      // Save the pending request
      sharedcache.pendingRequests[packetId] = fnHandler;
  
      // User specified that the message should have a timeout
  
      // Expire the response on timeout
      // IDEA start timeout when client is fully received?
      const timeoutId = setTimeout(() => {
        // "timed out" must be in the error message
        fnHandler(new Error("Reply timed out"));
      }, timeout);

      sharedcache.pendingRequestTimeouts[packetId] = timeoutId;
    } else {
      // Here we can handle timeouts of -1 for non-timeout requests if necessary
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


// Sends messages to all connected peers
// If wait == -1 then it will not time out
// If wait == 0/undefined/null then it will not wait
// If wait > 0, the timeout is number of ms to timeout
export function messageAllPeers(
  type: string,
  payload,
  timeout: number,
  callback
): void {
  // console.log("Messaging all peers:", payload, clientConnections);
  // Message to send:
  async.each(clientConnections, (client, callback) => {
    module.exports.messagePeer(client.socket, type, payload, timeout, callback);
  }, callback);
};

export function askAllPeers(
  type: string,
  payload,
  timeout: number,
  callback
): void {
  
};
