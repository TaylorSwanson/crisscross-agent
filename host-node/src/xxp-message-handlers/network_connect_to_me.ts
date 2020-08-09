// A client wants us to connect to them as a client, not a server

import os from "os";

import config from "config";

import sharedcache from "../modules/sharedcache";
import * as messager from "../modules/messager";
import { connectTo } from "../modules/host-client";
import { Socket } from "net";

const hostname = os.hostname().trim().toLowerCase();

function askOtherToIdentify(socket: Socket) {
  // Identify to the server who we are
  messager.messagePeer(socket, "network_handshake_identify", {
    header: {},
    content: {
      name: hostname
    }
  }, messager.Timeout.None, (err: Error) => {
    if (err) console.error(err);
  });
};

module.exports = function({ header, content, socket }) {
  connectTo(socket.localAddress, config.get("internalPort"), (
    err: Error,
    newSocket: Socket
  ) => {
    // Destroy old socket
    socket.end();
    socket.destroy();

    // Ask handshake so we can add them as an official client
    askOtherToIdentify(newSocket);
  });
};
