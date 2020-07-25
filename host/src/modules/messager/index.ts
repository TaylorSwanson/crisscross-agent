// Handles communication with other nodes over TCP
// This works both ways, sending messages to client peers and server peers

import os from "os";

const xxp = require("xxp");
import config from "config";

import * as connector from "../connector";
import sharedcache from "../sharedcache";
import { Socket } from "net";

const hostname = os.hostname().trim().toLowerCase();


interface ClientDefinition {
  socket: NodeJS.Socket,
  name: string
};

interface ClientAddresses {
  address: string,
  name: string
};

interface OriginalMessageFormat {
  socket: Socket | NodeJS.Socket,
  content: any,
  header: { [x: string]: any; }
};

export enum Timeout {
  None = -1
}

// Add a client stream, doesn't matter if it's a server or a client stream
export function addClient(client: ClientDefinition): void {

  if (connector.getClientConnections().some(c => c.name === hostname)) return;

  if (connector.getClientConnections().some(c => c.name === client.name)) {
    return console.warn(hostname, "-", "Client was already added to the messager:", client.name);
  }

  console.log(`${hostname} - adding client: ${client.name}`);

  connector.getClientConnections().push(client);
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
    return connector.getClientConnections().find(c => c.name === identifier)
  } else {
    // Looking by socket
    return connector.getClientConnections().find(c => c.socket == identifier);
  }
};

export function removeClientByName(clientName: string): void {
  const idx = connector.getClientConnections().findIndex(c => c.name == clientName);

  if (idx === -1) return;

  connector.getClientConnections().splice(idx, 1);
};

export function removeClientBySocket(socket: NodeJS.Socket): void {
  const idx = connector.getClientConnections().findIndex(c => c.socket == socket);

  if (idx === -1) return;

  connector.getClientConnections().splice(idx, 1);
};

// Get list of all connected ip addresses
export function getAllConnectionAddresses(): ClientAddresses[] {
  return connector.getClientConnections().map(c => ({
    address: c.localAddress,
    name: c.name
  }));
};

// Sends message to a specfic peer
// If timeout == -1 then it will not time out
// If timeout == 0/undefined/null then it will not time out
// If timeout > 0, the timeout is number of ms

// If timeout is <= 0 then there will be no additional response headers
export function messagePeer(
  socket: Socket,
  type: string,
  payload,
  timeout: number,
  callback
): void {

  if (!socket || socket.destroyed) {
    return callback("No socket");
  }

  console.log(`${hostname} - Message across xxp - ${type}`)

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
  const emptyResult = { header: null, content: null, socket };
  
  // Start sending the packet
  socket.write(packet.packet, function() {
    // console.log(`${hostname} - ${type} packet sent\n`);

    // Determine if we timeout or not
    // If not, we're done when the packet is sent
    if (timeout <= 0) {
      callback(null, emptyResult);
    } else {

      // This handler will be called on reply or timeout regardless
      // It is also responsible for cleaning up
      const fnHandler = (function() {
        return function(err?: Error, sockDetails?: OriginalMessageFormat) {
          // Callback would receive (err, { header, content, socket });
          callback(err, {
            socket: sockDetails.socket,
            header: sockDetails.header,
            content: sockDetails.content
          });
        }
      })();
  
      // Save the pending request
      sharedcache.pendingRequests[packetId] = fnHandler;

      // User specified that the message should have a timeout
      // Expire the response on timeout
      const timeoutId = setTimeout(() => {
        // "timed out" must be in the error message
        fnHandler(new Error(`${hostname} - Reply timed out: ${type} ${timeout}ms,\
packet:${packetId}`), emptyResult);

        clearTimeout(sharedcache.pendingRequestTimeouts[packetId]);
        delete sharedcache.pendingRequestTimeouts[packetId];
      }, timeout);

      sharedcache.pendingRequestTimeouts[packetId] = timeoutId;
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
  // @ts-ignore
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
  if (!connector.getClientConnections().length)
    return console.log("Cannot message all peers - none are available");
  
  console.log(`${hostname} - Messaging all peers:`, connector.getClientConnections().length);

  connector.getClientConnections().forEach(client => {
    // console.log(`${hostname} - sending one of many to ${client.name} type ${type}`);
    messagePeer(client.socket, type, payload, timeout, callback);
  });
};

// export function askAllPeers(
//   type: string,
//   payload,
//   timeout: number,
//   callback
// ): void {
  
// };


