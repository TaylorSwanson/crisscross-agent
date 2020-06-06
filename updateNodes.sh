#!/bin/bash

BASEDIR=$(dirname "$0")

if [ ! -d "$BASEDIR/host/node_modules" ]; then
  echo "Installing node_modules before continuing"
  $(cd ./host && npm install)
fi

echo "Building ts..."

cd $BASEDIR/host/
npm run build-ts
cd $BASEDIR

INSTANCENAMES=($(multipass list | sed -n '1d;p' | awk '{print $1}'))
for i in "${INSTANCENAMES[@]}"; do
  echo "Copying to $i"
  MOUNTPOINT="$BASEDIR/dev-mounts/$i"
  cp -r $BASEDIR/host/dist/* $MOUNTPOINT/host/ &
done

wait

echo "Done - you need to restart network nodes"
