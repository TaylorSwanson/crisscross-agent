const fs = require("fs");

const express = require("express");
const app = express();

const showdown = require("showdown");
const mdConverter = new showdown.Converter();

const serverApi = require("./server-api");

app.use((req, res, next) => {
  console.log(`${Date.now()}: ${req.method} ${req.path}`);
  next();
});

app.get("/servers", (req, res, next) => {
  serverApi.getAllServers(function(err, result) {
    if (err) return res.status(500).send(err);

    res.status(200).json(result);
  });
});

app.post("/servers", (req, res, next) => {
  serverApi.createServer
});

app.get("/", (req, res, next) => {
  // Show readme.md
  let readme = fs.readFileSync("./readme.md").toString();
  readme = mdConverter.makeHtml(readme);
  res.status(200).send(readme);
});

const server = app.listen(3334);

// 10 minute timeout
server.setTimeout(1000 * 60 * 10);

console.log("Spoof server listening on port", 3334);
