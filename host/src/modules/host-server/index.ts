// This module helps communicate with the peers by offering a server
// Newer peers connect to this server as clients, this server connects as a
// client to older peers

import net, { Server } from "net";
import os from "os";

import config from "config";

import sharedcache from "../sharedcache";
import * as messager from "../messager";
import messageHandler from "../../xxp-message-handlers";

// const packetDecoder = require("xxp").packetDecoder;
// const packetFactory = require("xxp").packetFactory;

import { packetDecoder } from "xxp";

let server: Server;

const activeSockets = {};

const port = config.get("internalPort");
const hostname = os.hostname().trim().toLowerCase();

export function start() {
  console.log(`${hostname} - Starting host server`, hostname);

  server = net.createServer(socket => {
    console.log(`${hostname} - A client connected`);
    // Client connected
    
    //@ts-ignore
    // const ipv4 = socket.address().address;
    // console.log(`${hostname} - ready to talk to client at ${ipv4}, registering handlers`);

    // This lets the server handle incoming messages with the message handlers
    packetDecoder(socket, messageHandler);
    

    // console.log(`${hostname} - asking client to idenfify, sending name`)

    // Identify to the client who we are
    messager.messagePeer(socket, "network_handshake_identify", {
      header: {},
      content: {
        name: hostname
      },
    }, messager.Timeout.None, (err) => {
      if (err) console.error(err);
    });

    //
    
    // Client dropped out
    socket.on("end", () => {
      // @ts-ignore
      console.log(`${hostname} - client at ${socket.address().address} ended connection`);

      messager.removeClient({
        socket,
        name: null
      });

      socket.end(null);
    });
  });

  server.on("end", () => {
    console.log(`${hostname} - server ended`);
  });

  server.on("error", err => {
    throw err;
  });

  server.listen(port, () => {
    console.log(`${hostname} - Host server bound to`, port);
  });
};

// Removes a client connection
module.exports.dropClient = function(socket, callback) {
  // // Find socket
  // if (!activeSockets.hasOwnProperty(ip))
  //   return console.error("Could not drop non-existent client");
  // const socket = activeSockets[ip];

  // const packet = packetFactory.newPacket({
  //   header: {
  //     type: "internal__connecting_to_you"
  //   },
  //   content: {
  //     yourIp: ip
  //   }
  // });

  // // Send last message to prevent reconnect, acknowledge
  // socket.end(packet, callback);

  // // Remove reference
  // delete activeSockets[ip];
};
