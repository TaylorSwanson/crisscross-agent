// This module helps communicate with the peers by connecting to their servers

import net, { Socket } from "net";
import os from "os";

import * as messager from "../messager";
import messageHandler from "../../xxp-message-handlers";

import xxp from "xxp";

const hostname = os.hostname().trim().toLowerCase();

// Connects just to a host server
export function connectTo(host: string, port: number, callback: Function) {
  // Don't connect if we are already connected to this server as a client
  const connected = messager.getAllConnectionAddresses();
  if (connected.some(c => c.address == host)) return;

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

    socket.destroy();
  });

  socket.on("ready", () => {
    console.log(`${hostname} - I'm a client to ${host}:${port}, registering handlers`);

    // This lets the server handle incoming messages with the message handlers
    xxp.packetDecoder(socket, messageHandler);

    callback(null, socket);
  });
};
