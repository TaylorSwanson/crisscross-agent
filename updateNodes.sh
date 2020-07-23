#!/bin/bash

BASEDIR=$(dirname "$0")

if [ ! -d "$BASEDIR/host/node_modules" ]; then
  echo "Installing node_modules before continuing"
  $(cd ./host && npm install)
fi


cd $BASEDIR/host/

echo "Building ts..."
npm run build-ts

echo "Building xxhost binary..."
nexe -t linux-x64-12.16.2 -i ./dist/index.js -r "./dist/**/*" -o $BASEDIR/xxhost
chmod +x $BASEDIR/xxhost

cd $BASEDIR

# Move config as one file, unpack on machine
tar -cf config.tar ./config


INSTANCENAMES=($(multipass list | sed -n '1d;p' | awk '{print $1}'))
for i in "${INSTANCENAMES[@]}"; do
  echo "Copying to $i"
  # MOUNTPOINT="$BASEDIR/dev-mounts/$i"
  # mkdir -p $MOUNTPOINT/host/

  # cp $BASEDIR/xxhost $MOUNTPOINT/host/xxhost &
  $(
  multipass copy-files $BASEDIR/xxhost $i:xxhost
  multipass copy-files $BASEDIR/config.tar $i:config.tar
  multipass exec $i -- bash -c "mkdir -p ./{host,config} && mv ./xxhost ./host/xxhost && tar -xf config.tar && rm config.tar"
  ) &
done


wait

# Make sure we clean up
function finish {
  rm $BASEDIR/config.tar
  rm $BASEDIR/xxhost
}

trap finish EXIT

echo "Done - you need to restart the nodes to see the changes"
