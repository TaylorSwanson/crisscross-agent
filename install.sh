#!/bin/bash

# Installs nodejs
cd /tmp/

curl -sL https://deb.nodesource.com/setup_14.x | bash -
apt-get install -y nodejs

# npm install && npm install -g forever
npm install -g forever
