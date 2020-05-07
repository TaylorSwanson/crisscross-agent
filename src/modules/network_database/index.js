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

const config = require("config");

// Used to check document integrity
const md5 = require("../../utils/static/md5");


// Where to place db
const folderName = config.get("configDbFolderName") || ".xxdb";
const dbRootPath = path.join(os.homedir(), folderName);


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
  
};

// Completely remove db contents
module.exports.deleteDb = function(callback) {

};

// Replaces all current DB content with specified dbContent
module.exports.setDb = function(dbContnet, callback) {

};
