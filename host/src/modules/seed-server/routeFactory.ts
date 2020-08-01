import fs from "fs";
import path from "path";

import { validationResult } from "express-validator";

// https://medium.com/@allenhwkim/nodejs-walk-directory-f30a2d8f038f
function walkDir(dir: string, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();

    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
};

export default function generateRoutes(rootDir: string) {
  const router = require("express").Router();

  rootDir = path.join(rootDir, "routes");

  // Scan through routes directory and find deepest files
  walkDir(rootDir, (filepath: string) => {
    if (filepath.endsWith(".map")) return;

    const relpath = filepath.slice(rootDir.length);
    const reqpath = path.dirname(relpath);

    // Method to use is the filename with ext (.js) trimmed off
    let method = path.basename(filepath);
    method = method.substring(0, method.length-3);
    const route = require(filepath);

    // Use method and path 
    // Check if using old style or new
    if (typeof route === "function") {
      router[method](reqpath, [], route);
    } else {
      // New style includes a validator
      // Embed the error handling here so it doesn't have to be duplicated
      const handle: Function = function(req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(422).json({ error: errors.array() });
        }
        // Call the actual handler if the validation passed
        route.handler(...arguments);
      };

      if (!route.handler) {
        const warnPath = path.relative(path.join(process.cwd(), "/dist/api"), filepath);
        console.log(`.. Route in "${warnPath}" has no handler`);
        return;
      }
      
      router[method](reqpath, route.validator || [], handle);
    }
  });

  return router;
};
