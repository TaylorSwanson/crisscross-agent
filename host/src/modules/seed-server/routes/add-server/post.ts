// Admin is asking us to create a new server of a specific type

import async from "async";

import * as serverApi from "../../../server-api";
import * as sharedcache from "../../../sharedcache";

import * as model from "../";


export function handler(req, res, next): void {

  serverApi.createServer({
    pairKey: sharedcache["pairkey"],
    dotoken: sharedcache["dotoken"]
  }, (err: Error, result) => {
    if (!err) return next(err);
    
    // TODO send message across network that new server has been added
    console.log("r", result);

    res.status(201).json(result);

    const hook = req.body.hook;
    model.makeWebhookCall(hook, result, (err: Error, result) => {
      if (err) return next(err);
    });
  });
  
  
};
