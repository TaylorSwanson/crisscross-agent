// This is a generic reply
// The header should have a reference to the original packet id that the
// response is aimed at

// This resolves a callback in the messager module

import os from "os";

// const xxp = require("xxp");
// import * as messager from "../modules/messager"; 
import sharedcache from "../modules/sharedcache"; 

const hostname = os.hostname().trim().toLowerCase();


module.exports = function({ header, content, socket }) {

  // console.log(`${hostname} - network_reply_generic: ${header} ${content}`);

  if (!header.hasOwnProperty("xxp__responseto"))
    throw new Error("Received reply packet with no responseTo header");
  
  const responseToId = header["xxp__responseto"];

  if (!sharedcache.hasOwnProperty("pendingRequests"))
    return console.warn("No pendingRequests object in sharedcache");
  
  // Check for response packetid-specific handler
  if (!sharedcache.pendingRequests[responseToId])
    return console.log(hostname, "-", "Pending request is closed:", responseToId);
  
  // Trigger the callback
  const cbFunction = sharedcache.pendingRequests[responseToId];
  if (typeof cbFunction != "function")
    throw new Error("Network reply callback must be a function");

  console.log(hostname, "-", "generic callback", content, responseToId);
  cbFunction(null, { header, content, socket });

  // Remove this handler to prevent duplicate callbacks
  clearTimeout(sharedcache.pendingRequestTimeouts[responseToId]);
  delete sharedcache.pendingRequests[responseToId];
  delete sharedcache.pendingRequestTimeouts[responseToId];
};
