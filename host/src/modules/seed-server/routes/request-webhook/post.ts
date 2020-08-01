// Server is asking us to use a webhook on the server side

import async from "async";

import * as model from "../";


export function handler(req, res, next): void {
  
  const hook = req.body.hook;

  model.makeWebhookCall(hook, (err: Error, result) => {
    if (err) return next(err);

    console.log("Called hook", result);

    if (!result) return res.status(500).end();

  });
};
