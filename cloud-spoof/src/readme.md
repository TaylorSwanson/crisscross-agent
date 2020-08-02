# Server API spoof
This server needs to be running so multipass instances can communicate with what
they think to be the cloud, when in reality this API is using the multipass cli
to mimic cloud actions, such as server creation/destruction/listing/etc.

See the root level readme.md file for more information.

## To run

This server makes use of the `addNode.sh` script in the parent directory. It is
not just a utility script.

* Make sure to run `npm install`

* Execute `npm start` from this dir. Server runs on port 3334. Default HTTP
timeout is 10 minutes.

### Methods

Since these processes can take a while, there is a high HTTP timeout. In reality
the DigitalOcean API would provide a callback when the processs is complete, so
this long request is a cheap way of doing this without implementing some sort of
"action complete" mechanism.

* `POST /servers`: Create a server instance. Body JSON can include the prop
`tags` which is an array of strings.

* `GET /servers`: List all servers in the cluster

* `GET /`: Show the readme file

## Attributes
Since we don't have the full DigitalOcean api to store tag names, we need to
store them on the fake nodes themselves as some sort of simple config file. This
is stored in home dir under a json file.
