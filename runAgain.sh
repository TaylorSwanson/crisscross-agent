#!/bin/bash

# Helper script to run when you've made changes to the host code

./stopAllNodes.sh
./updateNodes.sh 2>/dev/null
./startAllNodes.sh
