#!/bin/bash

instancename=`openssl rand -hex 5`
multipass launch -v -d 768M -m 320M -n "x$instancename" --cloud-init ./cloud_init.yml
