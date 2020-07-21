
import zmq from "zeromq";

export default async function(sock, message: string) {
  // TODO list peers instead of echo back
  return await sock.send(["peer_list", message]);
}
