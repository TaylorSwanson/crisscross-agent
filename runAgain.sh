#!/bin/bash

./stopAllNodes.sh
./updateNodes.sh 2>/dev/null
./startAllNodes.sh
