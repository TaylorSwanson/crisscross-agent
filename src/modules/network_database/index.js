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

// DB is essentially a document db but other data should theoretically be able
// to live within it too

// Locking the db is a manual process, so this should be considered

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

// 2 minutes
const unlockTimeoutWarnMs = 120000;
const unlockCheckIntervalMs = 500;

// Locking mechanism
let isLocked = false;
// This is set when the db is busy and can't be unlocked manually
// We need two vars because otherwise the user can unlock manually when it's
// not safe to
let cantUnlock = false;

// Simple helper so that cantUnlock is always set because it makes sense
function lock() {
  isLocked = true;
  cantUnlock = true;
}
function unlock() {
  isLocked = false;
  cantUnlock = false;
}

// Creates the db folder at the right location if not exists
function createDbFolder() {
  // DB folder create is sync, but the folder is created only on init so
  // it shouldn't affect application performance
  // Create if not exists
  if (!fse.existsSync(dbRootPath)) {
    fse.mkdirSync(dbRootPath);
  }
}

// Lists paths of all documents
// Doesn't lock, caller should be locking
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

// Sets the lock status of the db
// Unlock action is not immediate until the current processes have finished
// Callback issued when lock is changed, err on unlock attempts
module.exports.setLock = function(lockStatus, callback) {
  if (lockStatus) return (isLocked = true) && callback();

  // Unlocking db
  if (!cantUnlock) return (isLocked = false) && callback();

  // Will be a rough estimate
  let passedIntervalMs = 0;

  // DB is busy, we'll wait and check every unlockCheckIntervalMs roughly
  // Some operations take a long time so we can't crash the db, only log
  // Maybe this can be handled later, the console.warn is for debugging mostly
  const intervalId = setInterval(() => {
    if (!cantUnlock || !isLocked) {
      clearInterval(intervalId);
      // We can unlock now
      isLocked = false;
      cantUnlock = false;
      return callback();
    }
    passedIntervalMs += unlockCheckIntervalMs;

    // Check if this is the first time the interval has been passed
    // Determine if exceeded interval is the first overage of the timeout ms
    const exceededInterval = passedIntervalMs >= unlockTimeoutWarnMs;
    const isFirstOverage = passedIntervalMs - unlockCheckIntervalMs * 0.5 < unlockTimeoutWarnMs;

    // Show message if this is the first time it's passed the interval
    if (exceededInterval && isFirstOverage) {
      console.warn(`DB lock check interval ${unlockTimeoutWarnMs}ms exceeded`);
    }
  }, unlockCheckIntervalMs);
};

// Wait for db to be ready and unlocked
// This should be called before db functions, otherwise an error will be thrown
// if the db is already locked
module.exports.waitForReady = function(callback) {
  if (!isLocked) return callback();
  
  // Similar to above but doesn't work with cantUnlock variable
  // Will be a rough estimate
  let passedIntervalMs = 0;

  const intervalId = setInterval(() => {
    if (!isLocked) {
      clearInterval(intervalId);
      return callback();
    }
    passedIntervalMs += unlockCheckIntervalMs;

    // Check if this is the first time the interval has been passed
    // Determine if exceeded interval is the first overage of the timeout ms
    const exceededInterval = passedIntervalMs >= unlockTimeoutWarnMs;
    const isFirstOverage = passedIntervalMs - unlockCheckIntervalMs * 0.5 < unlockTimeoutWarnMs;

    // Show message if this is the first time it's passed the interval
    if (exceededInterval && isFirstOverage) {
      console.warn(`DB lock check interval ${unlockTimeoutWarnMs}ms exceeded`);
    }
  }, unlockCheckIntervalMs);
};

// Returns a progress update if any task is running
// TODO requires a method to update task status
module.exports.getProgress = function(callback) {
  //
};

// Returns a list of documents in the db
module.exports.getDocListing = function(callback) {
  if (isLocked) return callback(new Error("DB is locked"));
  lock();

  getDocPaths((err, paths) => {
    if (err) return callback(err);

    callback(null, paths.map(p => {
      return path.basename(p);
    }));

    unlock();
  });
};

// Generates a checksum of the entire db
module.exports.checksumDb = function(callback) {
  if (isLocked) return callback(new Error("DB is locked"));
  lock();

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
  ], (err, result) => {
    unlock();
    callback(err, results);
  });
};

// Completely remove db contents
// This will fail if the folder or files within are in use
module.exports.deleteDb = function(callback) {
  if (isLocked) return callback(new Error("DB is locked"));
  lock();

  fse.emptydir(dbRootPath, err => {
    if (err) return callback(err);

    // Recreate db folder just in case it was removed (but why? No harm in it)
    createDbFolder();
    unlock();
    callback();
  });
};

// Replaces all current DB content with specified dbContent
module.exports.replaceDb = function(dbContentStream, callback) {
  if (isLocked) return callback(new Error("DB is locked"));
  lock();
  
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

  ], (err, result) => {
    unlock();
    callback(err, results);
  });
};

// Exports entire db into one file to be read later
// Data will be streamed into a json file containing individual files
// This means json file will be built manually during stream
// Stream is a writeable file stream that is returned, consider gzipping it
module.exports.exportDb = function(callback, stream, callback) {
  if (isLocked) return callback(new Error("DB is locked"));
  lock();


  const filePaths = [];

  const writeStream = fse.createWriteStream();

  // Each file is on a newline so that it can be parsed line-by-line

  // Start constructing json
  writeStream.write(`{"time":"${Date.now()}",files":[\n`);

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

        return isIneligible;
      });

      callback(null, filtered);
    },
    function buildOutput(fileredFileStats, callback) {
      filteredFileStats.forEach((fileStat, idx) => {
        const filePath = filePaths[idx];

        // Construct json
        const fileName = path.basename(filePath);
        writeStream.write(`{"name":"${fileName}","content":"`); // ...

        // Start reading file
        const fd = fse.createReadStream(filePath);

        fd.on("data", chunk => {
          writeStream.write(chunk.toString("hex"));
        });

        fd.once("finish", () => {
          // End line of content
          writeStream.write(`"}`);

          // Add comma if this is not the last file
          if (idx < filePaths.length - 1)
            writeStream.write(`,`);
          
          writeStream.write(`\n`);
          callback();
        });
      });

      callback();
    },
    function closeJson(callback) {
      // This just closes the opening tag
      writeStream.write(`\n]}\n`);
      callback();
    }
  ], (err, result) => {
    unlock();
    callback(err, results);
  });
};


// Updates the document, creates if not exists
// Content can be anything accepted by writeFile
module.exports.updateDoc = function(docName, content, callback) {
  if (isLocked) return callback(new Error("DB is locked"));
  lock();

  const filename = path.join(dbRootPath, docName);

  fse.writeFile(filename, content, (err, result) => {
    unlock();
    callback(err, results);
  });
};

// If doc is json, then apply changes in content and add fields
// Creates doc if not exists
module.exports.editJsonDoc = function(docName, content, callback) {
  if (isLocked) return callback(new Error("DB is locked"));
  // lock();

};

// Removes the document
module.exports.deleteDoc = function(docName, callback) {
  if (isLocked) return callback(new Error("DB is locked"));
  lock();

  const filename = path.join(dbRootPath, docName);
  fse.remove(filename, (err, result) => {
    unlock();
    callback(err, results);
  });
};

// Returns document content
module.exports.getDoc = function(docName, callback) {
  if (isLocked) return callback(new Error("DB is locked"));
  lock();
  
  const filename = path.join(dbRootPath, docName);

  fse.pathExists(filename, (err, exists) => {
    if (err) return callback(err);
    if (!exists) return null;

    fse.readFile(filename, (err, result) => {
      unlock();
      callback(err, results);
    });
  });
};
