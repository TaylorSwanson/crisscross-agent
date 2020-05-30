#!/bin/bash

multipass stop --all && multipass delete --all && multipass purge

BASEDIR=$(dirname "$0")
rm -rf "$BASEDIR/dev-mounts/"*

echo "Done"
