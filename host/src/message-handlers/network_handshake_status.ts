// Determines if we've been accepted or not
// If not, we should disconnect

import os from "os";

const xxp = require("xxp");
import * as messager from "../modules/messager"; 

const hostname = os.hostname().trim().toLowerCase();

module.exports = function({ header, content, socket }) {

  if (content.status == "accepted") {
    console.log(`${hostname} - peer at ${socket.address().address} replied:`, content);

    messager.addClient({
      socket,
      name: content.name
    });
  } else {
    console.log(`${hostname} - peer at ${socket.address().address} rejected us:`, content);
  }
  
};
