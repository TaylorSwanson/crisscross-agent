# Host application
This application runs on each server and is not special to each server type, and
is only configured by peer nodes and/or the admin ui.

The host application is what is copied to each new node, where it is then
configured. A brand new node can be added to any network, and must be added to
a cluster before any source code can be loaded onto it.

Before the server is initialized, the node sits idle and does nothing.

New nodes request a list of all peer nodes from the API on startup, and that's
all.

### Notes
* The `tag` file in the host directory is the default tag of the server which is
used in development. The tag is replaced in the nodes when the test application
is launched. Otherwise, the tag comes from the native DigitalOcean tags API.
