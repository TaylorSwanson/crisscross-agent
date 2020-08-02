#!/bin/bash

echo "Starting on $1"
multipass exec $1 -- bash -c "cd host/ && npm start" &
multipass exec $1 -- bash -c "mkdir -p /home/ubuntu/.xxhost/"
# PairKey identifies the project
multipass exec $1 -- bash -c "echo \"$2\" > /home/ubuntu/.xxhost/pairkey"
# Token is used to create new servers
multipass exec $1 -- bash -c "echo \"$3\" > /home/ubuntu/.xxhost/DOTOKEN"
multipass exec $1 -- bash -c "touch /home/ubuntu/.xxhost/pairkeypending"
multipass exec $1 -- bash -c "touch /home/ubuntu/.xxhost/seedserver"
