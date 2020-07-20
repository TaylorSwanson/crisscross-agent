// This module helps communicate with the peers by connecting to their servers

import net from "net";
import os from "os";

const sharedcache = require("../sharedcache");
import * as messager from "../messager";
const messageHandler = require("../../message-handlers");

const xxp = require("xxp");

const hostname = os.hostname().trim().toLowerCase();

export function connectTo(host: string, port: number, callback: Function) {
  // Connect to a remote server
  const socket = net.createConnection(port, host, () => {
    console.log(`${hostname} - connecting to ${host}:${port}`);
  });

  socket.on("end", () => {
    console.log(`${hostname} - disconnected from ${host}:${port}`);
    // Lost connection, looks intentional (FIN packet sent)
    // We should have received a goodbye message so this shouldn't be an issue
    // TODO verify that we know it's gone
  });

  socket.on("error", err => {
    if (err.message.includes("ECONNREFUSED")) {
      return console.log(`${hostname} - not available as host: ${host}:${port}`);
    }
    console.log(`${hostname} - other error on ${host}:${port}`, err);
  });

  socket.on("ready", () => {
    // console.log(`${hostname} - ready to talk to server ${host}:${port}, registering handlers`);

    // This lets the server handle incoming messages with the message handlers
    xxp.packetDecoder(socket, messageHandler);

    // Identify to the server who we are
    messager.messagePeer(socket, "network_handshake_identify", {
      header: {},
      content: {
        name: hostname
      }
    }, messager.Timeout.None, (err) => {
      if (err) {
        callback(err);
        return console.error(err);
      }
      callback(null, socket);
    });
  });

};
