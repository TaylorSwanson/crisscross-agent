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

  if (!header.hasOwnProperty("xxp__responseto"))
    throw new Error("Received response packet with no responseTo header");

  if (!sharedcache.hasOwnProperty("pendingRequests"))
    return console.warn("No pendingRequests object in sharedcache");
  
  // Check for response packetid-specific handler
  if (!sharedcache.pendingRequests.hasOwnProperty(header["xxp__responseto"]))
    return console.log("Pending request is closed:", header["xxp__responseto"]);
  
  // Trigger the callback
  const cbFunction = sharedcache.pendingRequests[header["xxp__responseto"]];
  if (typeof cbFunction != "function")
    throw new Error("Network reply callback must be a function");

  cbFunction(null, { header, content, socket });
};
