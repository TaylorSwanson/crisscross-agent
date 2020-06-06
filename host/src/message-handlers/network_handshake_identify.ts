// This is a generic reply
// The header should have a reference to the original packet id that the
// response is aimed at

// This resolves a callback in the messager module

import os from "os";

import * as xxp from "xxp";
import * as messager from "../modules/messager"; 

const hostname = os.hostname().trim().toLowerCase();

export default function({ header, content, socket }) {

  console.log(`${hostname} - client at ${socket.address().address} identified \
as ${content.name}`);

  messager.addClient({
    socket: socket,
    name: content.name
  });

  const packet = xxp.newPacket({
    header: {
      type: "network_handshake_status"
    },
    content: {
      status: "accepted",
      name: hostname
    }
  }).packet;
  
  // Let client know that we are accepting messages now
  socket.write(packet, () => {
    console.log(`${hostname} - client at ${socket.address().address} is accepted`);
  });
};
