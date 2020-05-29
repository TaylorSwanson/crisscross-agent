// Main IPC server for the client application
// This is where we will communicate with the application we are supporting

const ipc = require("node-ipc");
ipc.config.rawBuffer = false;

module.exports.start = function() {
  ipc.serve(() => {
    ipc.server.on("connect", function() {
      console.log("IPC client connected");
      ipc.server.emit("message", `{ "connected": true }`);
    });
  });
};
