# Host application
This application runs on each server and is not special to each server type, and
is only configured by peer nodes and/or the admin ui.

The host application is what is copied to each new node, where it is then
configured. A brand new node can be added to any network, and must be added to
a cluster before any source code can be loaded onto it.

Before the server is initialized, the node sits idle and does nothing.

New nodes request a list of all peer nodes from the API on startup, and that's
all.

# Guest application endpoints
The guest application needs to be able to communicate with the host application.

These HTTP endpoints facilitate this communcation locally
