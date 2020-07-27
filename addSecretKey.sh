#!/bin/bash

# Executes a command on all machines 

./execAllNodes.sh "mkdir -p /home/ubuntu/.xxhost/"
./execAllNodes.sh "echo \"$1\" > /home/ubuntu/.xxhost/pairkey"

wait

echo "Secret key installed:" $1
echo "Now you must start the instance: ./runAgain.sh"
