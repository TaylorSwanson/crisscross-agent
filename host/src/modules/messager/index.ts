// Handles communication with other nodes over TCP
// This works both ways, sending messages to client peers and server peers

import os from "os";

const xxp = require("xxp");
import config from "config";

import * as serverApi from "../server-api";
import * as hostClient from "../host-client";
import sharedcache from "../sharedcache";

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
  content: any,
  header: { [x: string]: any; }
};

export enum Timeout {
  None = -1
}

// Add a client stream, doesn't matter if it's a server or a client stream
export function addClient(client: ClientDefinition): void {

  if (clientConnections.some(c => c.name === hostname)) return;

  if (clientConnections.some(c => c.name === client.name)) {
    return console.warn(hostname, "-", "Client was already added to the messager:", client.name);
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
  timeout: number,
  callback
): void {

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

      var timeoutId;

      // This handler will be called on reply or timeout regardless
      // It is also responsible for cleaning up
      const fnHandler = (function() {
        return function(err?: Error, sockDetails?: OriginalMessageFormat) {
          clearTimeout(timeoutId);
  
          // Callback would receive (err, { header, content, socket });
          callback(err, {
            socket: sockDetails.socket,
            header: sockDetails.header,
            content: sockDetails.content
          });
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
      timeoutId = setTimeout(() => {
        // "timed out" must be in the error message
        fnHandler(new Error(`${hostname} - Reply timed out: ${type} ${timeout}ms`), emptyResult);
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
  if (!clientConnections.length)
    return console.log("Cannot message all peers - none are available");
  
  console.log(`${hostname} - Messaging all peers:`, clientConnections.length);

  clientConnections.forEach(client => {
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


// This gets peers from multipass or the DO API, depending on environment
// This can fail locally if the spoof server isn't running
// It can fail in prod if the DO API is unavailable
// If DOAPI lists no servers but no err, then we'll wait for clients (we're alone)
// If we get an error we will indefinitely retry asking the API for peers
export function getPeers(callback): void {
  serverApi.getAllPeers("", (err, nodes) => {
    if (err) {
      console.error(`${hostname} - Could not list peers:`, err);
      console.log(`${hostname} - Retrying in 5 minutes since the API seems to be down`);
  
      return setTimeout(getPeers, 1000 * 60 * 5);
    }
  
    console.log(`${hostname} - Found ${nodes.length} servers:`, nodes);
    let connectablePeers = nodes.filter(n => n.hasOwnProperty("ipv4"));
  
    // Filter ourselves out
    connectablePeers = connectablePeers.filter(n => n.name !== hostname);
  
    console.log(`${hostname} - Of those servers, ${connectablePeers.length} are \
connectable:`, connectablePeers);

    return callback(null, connectablePeers);
  });
};


// Tell the other server to be the client
function tellOtherToConnectToMe(socket, callback) {

};

// We're going to connect as a client to every server and ask for uptime
export function start() {
  getPeers((err, peers) => {
    peers.forEach(peer => {
      hostClient.connectTo(peer.address, config.get("internalPort"), (err, socket) => {
        // Send message to ask for uptime
        messagePeer(socket, "network_ask_uptime", {
          header: {},
          content: {}
        }, 5000, (err, response) => {
          if (err) throw err;
          
          const myUptime = new Date().getTime() - sharedcache["starttime"];
          const theirUptime = response.content.uptime;

          console.log(`${hostname} - Peer uptime is ${theirUptime}`);
          console.log(`${hostname} - My uptime is ${myUptime}`);


          if (theirUptime > myUptime) {
            console.log(`${hostname} - I'll be the client`);
            // Pass details to client listener
            hostClient.connectTo(socket.address().address, config.get("internalPort"), (err, newSocket) => {
              // Destroy this original socket since a new one has been established
              socket.end();
              socket.destroy();
            });
          } else {
            console.log(`${hostname} - I'll be the server`);

            tellOtherToConnectToMe(socket, () => {
              // We won't talk this way anymore
              socket.end();
              socket.destroy();
            })
          }
        });
      });
    });
  });

};
