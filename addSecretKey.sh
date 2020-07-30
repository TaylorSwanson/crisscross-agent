#!/bin/bash

# Executes a command on all machines 

./execAllNodes.sh "mkdir -p /home/ubuntu/.xxhost/"
./execAllNodes.sh "echo \"$1\" > /home/ubuntu/.xxhost/pairkey"
./execAllNodes.sh "touch /home/ubuntu/.xxhost/pairkeypending"
./execAllNodes.sh "touch /home/ubuntu/.xxhost/seedserver"

wait

echo "Pair key installed:" $1
echo "Now you must start the instance: ./runAgain.sh"
