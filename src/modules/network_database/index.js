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

const fse = require("fs-extra");
const path = require("path");
const os = require("os");
const crypto = require("crypto");

const config = require("config");
const async = require("async");
const lineReader = require("line-reader");

const md5 = require("md5");


// Where to place db
const configFolderName = config.get("configDbFolderName") || ".xxdb";
const dbRootPath = path.join(os.homedir(), configFolderName);


function createDbFolder() {
  // DB folder create is sync, but the folder is created only on init so
  // it shouldn't affect application performance
  // Create if not exists
  if (!fse.existsSync(dbRootPath)) {
    fse.mkdirSync(dbRootPath);
  }
}

function getDocPaths(callback) {
  const filePaths = [];
  
  async.waterfall([
    function listFiles(callback) {
      fse.readdir(dbRootPath);
    },
    function statFiles(fileList, callback) {
      async.each(fileList, (fileName, callback) => {
        const filePath = path.join(__dirname, fileName);
        filePaths.push(filePath);

        fse.stat(filePath, callback);
      }, callback);
    },
    function sortFiles(fileStats, callback) {
      const filtered = fileStats.filter((fileStat, idx) => {
        // Ignore directories
        const isIneligible = !fileStat.isDirectory() || !fileStat.isFile();

        // Remove ineligible files from the paths at idx
        filePaths.splice(idx, 1);

        return !isIneligible;
      });

      callback(null, filePaths);
    }

  ], callback);
}

// Puts the db in memory for faster access
// This isn't necessary for most tasks, may be removed..
module.exports.loadDbToMem = function(callback) {

};

// Returns a list of documents in the db
module.exports.getDocListing = function(callback) {
  getDocPaths((err, paths) => {
    if (err) return callback(err);

    callback(null, paths.map(p => {
      return path.basename(p);
    }));
  });
};

// Generates a checksum of the entire db
module.exports.checksumDb = function(callback) {
  async.waterfall([
    getDocPaths,
    function hashFiles(filePaths, callback) {
      async.each(filePaths, (filePath, callback) => {

        // Stream each file instead of reading to memory
        const hash = crypto.createHash("sha1");
        const fd = fse.createReadStream(filePath);

        fd.on("error", callback(err)).pipe(hash);

        fd.once("finish", () => {
          callback(null, hash.digest("hex"));
        });
      }, callback);
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
// This will fail if the folder or files within are in use
module.exports.deleteDb = function(callback) {
  fse.emptydir(dbRootPath, err => {
    if (err) return callback(err);

    // Recreate db folder just in case it was removed (but why? No harm in it)
    createDbFolder();
    callback();
  });
};

// Replaces all current DB content with specified dbContent
module.exports.replaceDb = function(dbContentStream, callback) {
  
  async.waterfall([
    // First delete the db
    module.exports.deleteDb,
    // Parse
    function replaceDb(callback) {
      let lineNumber = 0;
      // Take readable stream and parse it out into files again
      lineReader.eachLine(dbContentStream, (line, isLast, callback) => {
        lineNumber++;
        // Skip first/last line, we're interested in files only
        if (lineNumber === 1 || isLast) {
          return callback(true);
        }

        // This part will take the most memory
        // Larger documents will take more ram
        const document = JSON.parse(line);
        const filename = path.join(dbRootPath, document.name);
        // Create the file from the hex contents of the json object
        fse.writeFile(filename, Buffer.from(document.content, "hex"), err => {
          if (err) return callback(false);
          callback(true);
        });
      }, callback);
    }

  ], callback);
};

// Exports entire db into one file to be read later
// Data will be streamed into a json file containing individual files
// This means json file will be built manually during stream
// Stream is a writeable file stream that is returned, consider gzipping it
module.exports.exportDb = require("./exportDb");

// Updates the document, creates if not exists
// Content can be anything accepted by writeFile
module.exports.updateDoc = function(docName, content, callback) {
  const filename = path.join(dbRootPath, docName);

  fse.writeFile(filename, content, callback);
};

// If doc is json, then apply changes in content and add fields
// Creates doc if not exists
module.exports.editJsonDoc = function(docName, content, callback) {

};

// Removes the document
module.exports.deleteDoc = function(docName, callback) {
  const filename = path.join(dbRootPath, docName);

  fse.remove(filename, callback);
};

// Returns document content
module.exports.getDoc = function(docName, callback) {
  const filename = path.join(dbRootPath, docName);

  fse.pathExists(filename, (err, exists) => {
    if (err) return callback(err);
    if (!exists) return null;

    fse.readFile(filename, callback);
  });
};
