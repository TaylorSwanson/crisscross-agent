// A client wants us to connect to them as a client, not a server

import config from "config";

import sharedcache from "../modules/sharedcache";
import { connectTo } from "../modules/host-client";

module.exports = function({ header, content, socket }) {
  connectTo(socket.address().address, config.get("internalPort"), (err, newSocket) => {
    // Destroy old socket
    socket.end();
    socket.destroy();
  });
};
