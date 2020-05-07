// This is a simple document-based database that persists on disk
// It's incredibly basic and is used to store config files for the server
// Namely this data is used for configuration mostly in the web ui
// It needs to be sync (publically) so that changes are written to disk before
// the network gives the "ok" that the data has been stored
// If all nodes disappear, then the db is lost too

// Alternative dbs were considered such as sqlite3 but the relational nature
// is too complex for dynamic config settings
// The application also needs to be lightweight so writing a very simple
// implementation is probably the best route

// Data is stored under the home dir of the user running the appication under
// a dotfile directory

// More complex databases are better for production-level multi-user systems
// but this application is mostly for admins who won't be making tons of reqs.
// per second, requiring consistency

// Each node operates from its own database, occasionally checking to see if the
// database is in sync

// Whenever a change is made, maybe through the admin panel, all nodes have to
// confirm that they have the same db

// DB is essentially a document db

const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

const config = require("config");
const async = require("async");


const md5 = require("md5");


// Where to place db
const configFolderName = config.get("configDbFolderName") || ".xxdb";
const dbRootPath = path.join(os.homedir(), configFolderName);


// DB folder create is sync, but the folder is created only on init so
// it shouldn't affect application performance
// Create if not exists
if (!fs.existsSync(dbRootPath)) {
  fs.mkdirSync(dbRootPath);
}

// Puts the db in memory for faster access
// This isn't necessary for most tasks, may be removed..
module.exports.loadDbToMem = function(callback) {

};

// Generates a checksum of the entire db
module.exports.checksumDb = function(callback) {
  const filePaths = [];

  async.waterfall([
    function listFiles(callback) {
      fs.readdir(dbRootPath);
    },
    function statFiles(fileList, callback) {
      async.each(fileList, (fileName, callback) => {
        const filePath = path.join(__dirname, fileName);
        filePaths.push(filePath);

        fs.stat(filePath, callback);
      }, callback);
    },
    function sortFiles(fileStats, callback) {
      const filtered = fileStats.filter((fileStat, idx) => {
        // Ignore directories
        const isIneligible = !fileStat.isDirectory() && fileStat.isFile();

        // Remove ineligible files from the paths at idx
        filePaths.splice(idx, 1);

        return isIneligible;
      });

      callback(null, filtered);
    },
    function hashFiles(fileredFileStats, callback) {
      async.each(filteredFileStats, (file, callback) => {
        // Get file path from index of filteredFile
        const idx = filteredFileStats.findIndex(file);

        // Stream each file instead of reading to memory
        const hash = crypto.createHash("sha1");
        const filePath = filePaths[idx];
        const fd = fs.createReadStream(filePath);

        fd.on("error", callback(err)).pipe(hash);

        fd.once("finish", () => {
          callback(null, hash.digest("hex"));
        });
      });
    },
    function generateFinalHash(fileHashes, callback) {
      // Join them all together
      const concatenated = fileHashes.concat("");
      // Hash the concatenated string for smaller size
      callback(null, md5(concatenated));
    }
  ], callback);
};

// Completely remove db contents
module.exports.deleteDb = function(callback) {

};

// Replaces all current DB content with specified dbContent
module.exports.setDb = function(dbContnet, callback) {

};

// Updates the document
module.exports.updateDoc = function(docName, content, callback) {

};

// Removes the document
module.exports.deleteDoc = function(docName, callback) {

};

// Returns document content
module.exports.getDoc = function(docName, callback) {

};
