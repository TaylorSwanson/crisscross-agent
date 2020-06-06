#!/bin/bash

# Runs the application on all nodes
INSTANCENAMES=($(multipass list | sed -n '1d;p' | awk '{print $1}'))
for i in "${INSTANCENAMES[@]}"; do
  echo "Starting on $i"
  # multipass exec $i -- bash -c "cd host/ && npm start" &
  # multipass exec $i -- bash -c "ls -a ./host/" &
  multipass exec $i -- bash -c "chmod +x ./host/xxhost && ./host/xxhost" &
  sleep 2.5s
done
