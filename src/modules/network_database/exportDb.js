const fse = require("fs-extra");
const path = require("path");

const async = require("async");


module.exports = function(callback, stream, callback) {

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
  ], callback);
};
