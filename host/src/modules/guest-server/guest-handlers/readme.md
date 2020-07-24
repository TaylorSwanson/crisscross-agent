# Handlers for zmq messages from guest application
Each filename in this dir matches a recognized handler for messages sent by the
guest application to the host application.

### Example
When the guest application wants the list of servers in the network, the guest
will send a message "peer_listing" which would trigger the "peer_listing.ts"
handler in this directory.

