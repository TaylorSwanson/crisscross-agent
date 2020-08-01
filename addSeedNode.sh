#!/bin/bash

# Executes a command on all machines 

./execAllNodes.sh "mkdir -p /home/ubuntu/.xxhost/"
# PairKey identifies the project
./execAllNodes.sh "echo \"$1\" > /home/ubuntu/.xxhost/pairkey"
# Token is used to create new servers
./execAllNodes.sh "echo \"$2\" > /home/ubuntu/.xxhost/DOTOKEN"
./execAllNodes.sh "touch /home/ubuntu/.xxhost/pairkeypending"
./execAllNodes.sh "touch /home/ubuntu/.xxhost/seedserver"

wait

echo "Pair key installed:" $1
echo "API key installed:" $2
echo "Now you must start the instance: ./runAgain.sh"
