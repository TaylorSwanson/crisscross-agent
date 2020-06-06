#!/bin/bash

# Helper script to run when you've made changes to the host code

./stopAllNodes.sh
./updateNodes.sh
./startAllNodes.sh
