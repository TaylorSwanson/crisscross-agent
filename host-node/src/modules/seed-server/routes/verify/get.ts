// Tell backend server that we are here

import sharedcache from "../../../sharedcache";

export function handler(req, res, next): void {
  
  // Return our connection string
  res.status(200).json({
    accessKey: sharedcache["pairkey"]
  });
};
