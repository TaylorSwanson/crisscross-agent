#!/bin/bash

# This script is used by the spoof server to pretend to be the DigitalOcean API
# It is necessary for this file to be in the root of this project

# You can also call this script manually from the command line with no args


BASEDIR=$(dirname "$0")

# Make sure node modules are installed
if [ ! -d "$BASEDIR/host/node_modules" ]; then
  echo "Installing node_modules before continuing"
  $(cd ./host && npm install)
fi

# Node needs a random name to prevent collisions
INSTANCENAME=`openssl rand -hex 5`
INSTANCENAME="x$INSTANCENAME"

# # Do the magic with multipass
multipass launch -vv -d 512M -m 360M -n "$INSTANCENAME" --cloud-init ./dev_cloud_init.yml

# Send this archive over to new instance
NEWIP=$(multipass list | grep $INSTANCENAME | awk '{print $3}')
echo "New node created:"

# IMPORTANT last line must be the ip address and name of the server
echo $NEWIP $INSTANCENAME
