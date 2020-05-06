#!/bin/bash

# Installs nodejs
cd /tmp/

curl -sL https://deb.nodesource.com/setup_12.x -o nodesource_setup.sh

sudo ./nodesource_setup.sh && rm nodesource_setup.sh

# Install packages for the daemon
sudo apt install nodejs
# npm install && npm install -g forever
npm install -g forever
