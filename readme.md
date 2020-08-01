# CrissCross Agent
The CrissCross agent is the host of the application that the user wants to run,
aka the "guest" program.

## Normal usage
You shouldn't need to use this repo locally if you are using it just for hosting
your application. The host directory will automatically be loaded onto new nodes
in the network for your project and the rest will be configured through the
admin management console.

## Development usage
You will need to start a server to spoof the DigitalOcean api. The server is
found in the `spoof` dir in this project, follow the instructions in its readme.


# Philosophy
The agent is supposed to be lightweight and communicates with other agents over
a shared network. There are plans to make this communication work over TLS.

An admin dashboard is used to configure the network, and it otherwise runs
autonomously based on the configuration set by the admin dashboard. The main
idea is that the user can host the admin dashboard themselves or purchase it as
a service that is in theory always available. This is useful in the event that
your network is damaged beyond repair, including the admin dashboard with the
database attached.

Security is the responsibility of the user, but the dashboard provides ways to
reissue secrets and update the DO access token (DOTOKEN).

## How it works
In theory, the system communicates between each node using the simple xxp
protocol over tcp. The system communicates with the backend of the admin dash
with the same protocol. The admin dashboard points to a single server on the
cluster and is then connected to the rest of the nodes in the network. It will
retry to access the nodes if the currently-connected one is lost.

The admin dashboard does not interact with the DO API at all, this is the task
of the agents as well. This allows for the separation between the UI and the
functionality.

Since the admin panel does not directly communicate with the DO API except to
configure an initial "seed" server, it is unable to decrypt the secrets of the
application. This decouples the two for security.

The guest application communicates with the agent network using IPC. It's
completely possible to route most if not all application networking through this
channel, though it should primarily be used as a means to keep the servers
working together.

The admin dashboard also allows for the application to communicate and run
rolling distributions and updates using the same network. The agent essentially
runs the application's configuration while the guest sits on top. The guest app
has access to the network but its use is not required. It doesn't even need to
know that it's being run on a cluster, the only necessary components are a conf
file and a few scripts if specified in the conf file. Each app could be its own
git repo, which can be configured in the settings dashboard. This lets the
config files stay with the guest application, and allows the guest to update
based on the git version.

# Development prerequisites

* `Multipass`: used to spoof DigitalOcean droplets for local development.
* `NodeJS`: Built using v14.
* `OpenSSL`: Used for crypto, typically installed everywhere anyways.

* The `crisscross-example-project` for development is a helpful tool to monitor
network activity and runs as if it were a production app.

### Env variables
These variables are used/necessary for development:

* `XX_APPDIR`: used to specify where to look for the application root. In dev,
it's recommended that this variable be set to the `crisscross-example-project`
directory. This allows for debugging and also acts as a test platform.

# Example/debug project
This is an app designed to run on the cluster in development, it will give you
insights into how the network is functioning and will let you test a few of its
features. Clone it to somewhere in your dev environment and point the
`XX_APPDIR` env variable to the directory; see above.

See the `crisscross-example-project` repo here:
https://github.com/TaylorSwanson/crisscross-example-project

# How the app manages executables
A single executable file is created called `xxhost` which is distributed to each
node and has no dependencies, since node is packed inside.

## Old development process
- Start multipass instances in a cluster, use `addCluster.sh <number>`. On
some occasions this will not work because of a socket error, try again and it
should work.
- To load the files initially, execute `runAgain.sh`
- On changes, run `runAgain.sh`
- Once done, clean up the cluster by running `deleteAllNodes.sh` or pause all
instances by running `stopAllNodes.sh`. Deleting nodes requires you to create
the cluster again.

## New development process
- Use the web UI to create a cluster locally
- This simulates the real environment
- Use node cli tool in backend to communicate with local cluster ip addresses
