#!/bin/bash

echo "Starting on $1"
multipass exec $1 -- bash -c "cd host/ && npm start" &
