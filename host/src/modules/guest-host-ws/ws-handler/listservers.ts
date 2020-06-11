// Lists the servers in the network

import ws from "ws";

import * as messager from "../../messager";

module.exports = function(ws: ws, message: object, callback: Function): void {
  const servers = messager.getAllConnectionAddresses();

  callback(null, "serverlist", {
    servers
  });
};
