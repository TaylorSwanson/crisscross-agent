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

tar -cf config.tar ./config


INSTANCENAMES=($(multipass list | sed -n '1d;p' | awk '{print $1}'))
for i in "${INSTANCENAMES[@]}"; do
  echo "Copying to $i"
  # MOUNTPOINT="$BASEDIR/dev-mounts/$i"
  # mkdir -p $MOUNTPOINT/host/

  # cp $BASEDIR/xxhost $MOUNTPOINT/host/xxhost &

  multipass copy-files $BASEDIR/xxhost $i:xxhost
  multipass copy-files $BASEDIR/config.tar $i:config.tar
  multipass exec $i -- bash -c "mkdir -p ./{host,config} && mv ./xxhost ./host/xxhost && tar -xf config.tar && rm config.tar" &
done

wait

rm $BASEDIR/xxhost

echo "Done - you need to restart network nodes"
