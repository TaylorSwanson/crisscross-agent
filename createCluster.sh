#!/bin/bash

# Usage: ./createCluster.sh <number of servers>
NUMSERVERS=$1

BASEDIR=$(dirname "$0")

# # Secret key used to identify a cluster and link nodes
# CLUSTERSECRET=`openssl rand -hex 32`

for ((i =0; i<$NUMSERVERS; i++)); do
  $BASEDIR/addNode.sh &
done

wait
