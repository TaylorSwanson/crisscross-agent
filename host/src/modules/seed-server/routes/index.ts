// Main model for seed server hooks

import os from "os";
import fs from "fs";
import path from "path";
import http from "http";
import child_process from "child_process";

import config from "config";
import axios from "axios";

import sharedcache from "../../sharedcache";

export function makeWebhookCall(path: string, callback: GenericCallback) {

  const pairKey: string = sharedcache["pairkey"];

  let gateway = "";
  if (!process.env.PRODUCTION) {
    // We need to know the default gateway to connect to the API server
    const getGateway = "ip route show | grep 'default' | awk '{print $3}'";
    gateway = child_process.execSync(getGateway).toString("utf8").trim();
  } else {
    gateway = "api.crisscross.app";
  }

  axios.post("/api-1/" + path, {
    pairKey
  }, { timeout: 5000 })
  .then(function (response) {
    console.log("Triggered requested webhook");
    console.log(response);
  })
  .catch(function (error) {
    console.log("Error triggering requested webhook, trying again in 1 minute");
    console.log(error);

    setTimeout(() => { makeWebhookCall(path, callback) }, 1000 * 60);
  });
};
