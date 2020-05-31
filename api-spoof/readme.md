# API spoof
While developing applications to run on the cloud, you need to be able to use
the API that CrissCross makes available to you, but you also need to be able to
run your local servers.

### Traditional method
A common practice is to point your dev environment variables to some port on
`localhost`, however this doesn't scale in the cloud where localhost is not the
server you want to connect to.

### The CrissCross way
Even if your dev environment uses `localhost` to point your application server to
your database server on a different port (as an example), you should instead use
the HTTP connection that CrissCross provides as your means of "discovering" your
other servers.

Use this spoof server to "discover" network appliances such as your database as
if it were running in the cloud. This means that there is no hardcoding your
local servers into your standard config file, and instead hardcoding it into
your application as if you were connecting to tagged server "nodes".

This means that your application can run in the CrissCross environment on the
cloud and in the local cloud (with Multipass) without any change to your configs
or additional hassle.

# Usage
Modify the file `spoof.json` in this directory to include the server(s) that you
want to run locally that will be fed back to your guest application.

Specify the port number and the ip address that you want CrissCross to return
and the spoof server will respond to requests via HTTP as if the network is
returning actual server nodes.

You can also have the spoof server point to other nodes on the network or over
the internet instead of `127.0.0.1` or `localhost`.

Each node is tagged as the instance type as usual.

Example json:
```json
  [
    {
      "name": "mariadb",
      "location": "127.0.0.1",
      "port": 3306
    },
    {
      "name": "backend",
      "location": "127.0.0.1",
      "port": 4000
    }
  ]
```

# Endpoints
These are the same endpoints that the CrissCross cloud agent will provide to
your application so that no changes are necessary for switching to the cloud
environemtn

* `GET /servers/:tag?`: List servers that are available to the application,
optionally filtering by the tag
