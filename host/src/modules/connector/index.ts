
import os from "os";

import config from "config";

import * as messager from "../messager";
import * as serverApi from "../server-api";
import * as hostclient from "../host-client";
import sharedcache from "../sharedcache";
import { Socket } from "net";


const hostname = os.hostname().trim().toLowerCase();

// sharedcache.clientConnections = [];
// const clientConnections = sharedcache.clientConnections;
const clientConnections = [];

// Keep track of which sockets are servers
const serverSockets: Array<Socket> = [];

export function getClientConnections() {
  return clientConnections;
};

// Tell the other server to be our client
function tellOtherToConnectToMe(socket: Socket, callback) {
  messager.messagePeer(socket, "network_connect_to_me", {
    header: {},
    content: {}
  }, messager.Timeout.None, callback);
};

function askOtherToIdentify(socket: Socket) {
  // Identify to the server who we are
  messager.messagePeer(socket, "network_handshake_identify", {
    header: {},
    content: {
      name: hostname
    }
  }, messager.Timeout.None, (err) => {
    if (err) {
      console.error(err);
    }
  });
};

function determineRole(socket: Socket) {
  // Send message to ask for uptime
  messager.messagePeer(socket, "network_ask_uptime", {
    header: {},
    content: {}
  }, 2000, (err, response) => {
    if (err) {
      console.log(hostname, "-", "err", err);
      // Throw away socket, try again
      socket.destroy();

      // attemptToConnectToPeer(peer);
      return;
    }
    
    const myUptime = new Date().getTime() - sharedcache["starttime"];
    const theirUptime = response.content.uptime;

    console.log(`${hostname} - Peer uptime is ${theirUptime}`);
    console.log(`${hostname} - My uptime is ${myUptime}`);


    if (theirUptime > myUptime) {
      console.log(`${hostname} - I'll be the client`);
      
      // Send handshake now, we'll add them as a client
      askOtherToIdentify(socket);

      serverSockets.push(socket);

    } else {
      // Rare case where this server got disconnected and then reconnected

      console.log(`${hostname} - I'll be the server`);

      tellOtherToConnectToMe(socket, () => {
        // We won't talk this way anymore
        // Handshake will occur once they connect
        socket.end();
        socket.destroy();

      });
    }
  });
};

function attemptToConnectToPeer(peer) {
  hostclient.connectTo(peer.address, config.get("internalPort"), (err, socket) => {
    // Wait for xxp listener to be ready
    determineRole(socket);
  });
}

function isCLientAServer(socket: Socket): boolean {
  return serverSockets.includes(socket);
}

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
  
    // console.log(`${hostname} - Found ${nodes.length} servers:`, nodes);
    let connectablePeers = nodes.filter(n => n.hasOwnProperty("ipv4"));
  
    // Filter ourselves out
    connectablePeers = connectablePeers.filter(n => n.name !== hostname);
  
//     console.log(`${hostname} - Of those servers, ${connectablePeers.length} are \
// connectable:`, connectablePeers);

    return callback(null, connectablePeers);
  });
};


// We're going to connect as a client to every server and ask for uptime
export function start() {

  getPeers((err, peers) => {
    peers.forEach(peer => {
      attemptToConnectToPeer(peer);
    });
  });


  setTimeout(() => {
    // List connections
    clientConnections.forEach(cc => {
      const isServerString = !isCLientAServer(cc.socket) ? "Server" : "Client";
      console.log(`${hostname} - Connected to ${cc.name} as a ${isServerString}`);
    });
  }, 20000);

};
