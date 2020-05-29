#!/bin/bash

BASEDIR=$(dirname "$0")


if [ ! -d "$BASEDIR/host/node_modules" ]; then
  echo "Installing node_modules before continuing"
  $(cd ./host && npm install)
fi


INSTANCENAME=`openssl rand -hex 5`
INSTANCENAME="n$INSTANCENAME"
# This is where we will mount the fs of each node
MOUNTPOINT="$BASEDIR/dev-mounts/$INSTANCENAME"

CACHEPATH="$BASEDIR/dev-cache/"
mkdir -p $CACHEPATH

# We do this so the node version is always the same
INSTALLERURL="https://deb.nodesource.com/setup_14.x"
INSTALLNAME="setup_14.sh"
INSTALLSCRIPTPATH="$CACHEPATH/$INSTALLNAME"

if [ -f "$CACHEPATH/$INSTALLNAME" ]; then
  # echo "Using existing install script $INSTALLNAME"
  echo ""
else
  echo "Downloading install script from $INSTALLERURL"

  curl -SLsf "https://deb.nodesource.com/setup_14.x" > $INSTALLSCRIPTPATH
fi

multipass launch -vv -d 512M -m 400M -n "$INSTANCENAME" --cloud-init ./dev_cloud_init.yml
mkdir -p $MOUNTPOINT

# Send this archive over to new instance
NEWIP=$(multipass list | grep $INSTANCENAME | awk '{print $3}')
echo "New node at $NEWIP"

# Mount, then make sure mount is at home
# Mount directory must not exist already
multipass mount $MOUNTPOINT $INSTANCENAME:/home/ubuntu/host
echo "Node mounted at $MOUNTPOINT at remote /home/ubuntu/host"

echo "Installing deps"
cp $INSTALLSCRIPTPATH "$MOUNTPOINT/$INSTALLNAME"
multipass exec $INSTANCENAME -- sudo chmod +x /home/ubuntu/host/$INSTALLNAME
multipass exec $INSTANCENAME -- sudo /home/ubuntu/host/$INSTALLNAME
multipass exec $INSTANCENAME -- rm /home/ubuntu/host/$INSTALLNAME
multipass exec $INSTANCENAME -- sudo apt-get install -y nodejs
multipass exec $INSTANCENAME -- sudo npm install -g forever

echo "Copying host dir"
cp -r ./host/* $MOUNTPOINT

echo "Done"
