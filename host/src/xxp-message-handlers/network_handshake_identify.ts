// This is a generic reply
// The header should have a reference to the original packet id that the
// response is aimed at

// This resolves a callback in the messager module

import os from "os";

const xxp = require("xxp");
import * as messager from "../modules/messager"; 

const hostname = os.hostname().trim().toLowerCase();

module.exports = function({ header, content, socket }) {

//   console.log(`${hostname} - client at ${socket.address().address} identified \
// as ${content.name}`);

  messager.addClient({
    socket: socket,
    name: content.name
  });
};
