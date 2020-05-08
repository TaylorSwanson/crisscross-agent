// Update the local database and respond when the db is stable and on disk
// This should make sure all nodes are in sync with config details

const readable = require("stream").Readable;


const packetFactory = require("../utils/static/packetFactory");
const networkDatabase = require("../modules/network-database");
const ReadableString = require("../utils/static/ReadableString");


module.exports = function({ header, content, stream }) {

  // Build response based on requested behavior
  const responseContent = {};

  // Call can be for any db action that has a handler
  const dbMethod = content.dbMethod;

  // Handlers should have the same names as networkDatabase fns
  const handlers = {
    getDocListing: function(callback) {
      networkDatabase.getDocListing(callback);
    },
    checksumDb: function(callback) {
      networkDatabase.checksumDb(callback);
    },
    deleteDb: function(callback) {
      networkDatabase.deleteDb(callback);
    },
    replaceDb: function(callback) {
      // Must create a stream to replace the db content with
      const readStream = new ReadableString(content.dbcontent);
      networkDatabase.replaceDb(readStream, callback);
    },
    exportDb: function(callback) {
      // Like a pointer
      let stream;
      // Stream chunks come in as Buffers
      let buffers = [];
      // Stream out, ignore callback
      networkDatabase.exportDb(stream, () => {});
      // Converting stream to a single buffer
      stream.on("data", buf => {
        buffers.push(buf);
      });
      stream.on("error", err => {
        callback(err);
        buffers = [];
      });
      stream.on("end", () => {
        const finalBuffer = Buffer.concat(buffers);
        buffers = [];
        callback(null, finalBuffer);
      });
    },
    updateDoc: function(callback) {
      networkDatabase.updateDoc(content.docName, content.content, callback);
    },
    deleteDoc: function(callback) {
      networkDatabase.deleteDoc(content.docName, callback);
    },
    getDoc: function(callback) {
      // Doesn't use a buffer to read files
      networkDatabase.getDoc(content.docName, callback);
    }
  };

  if (!handlers.hasOwnProperty(dbMethod)) {
    responseContent = {
      err: `No handler for db method named ${dbMethod}`
    };
  }

  // Call handler for the db function directly
  handlers[dbMethod]((err, result) => {
    responseContent = {
      err,
      result
    };
  });


  const packet = packetFactory.newPacket({
    header: {
      type: "network_reply_generic",
      "xxh__responseto": header["xxh__packetid"]
    },
    content: responseContent
  }).packet;

  stream.write(packet);
};
