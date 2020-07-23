#!/bin/bash

# Executes a command on all machines

INSTANCENAMES=($(multipass list | sed -n '1d;p' | awk '{print $1}'))
for i in "${INSTANCENAMES[@]}"; do
  echo "Executing on $i:"
  multipass exec $i -- bash -c "$1"
done

wait
