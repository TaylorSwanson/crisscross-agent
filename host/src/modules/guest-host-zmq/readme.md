# Message subjects
Each subject will have metadata attached.

- `peer_added` emitted once a server on the network has been attached
- `peer_removed` emitted once a server on the network has disappeared
- `peer_listing` response from application when guest wants to know list of all peers
- `shutdown_request` emitted when the node is about to be turned off for maintenance
- `shutdown_ready` response from application when node can be safely shut down
- `health_check ` emitted if the node is accepting health checks in-application
- `health_request` emitted if the network wants to know the status of the application
