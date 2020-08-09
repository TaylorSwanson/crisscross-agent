
import net from "net";

export default function(socket: net.Socket, message: string) {
  // TODO list peers instead of echo back
  return socket.write(message);
}
