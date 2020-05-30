#!/bin/bash

# Runs the application on all nodes
INSTANCENAMES=($(multipass list | sed -n '1d;p' | awk '{print $1}'))
for i in "${INSTANCENAMES[@]}"; do
  echo "Starting on $i"
  multipass exec $i -- bash -c "cd host/ && npm start &" &
done
