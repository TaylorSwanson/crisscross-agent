// Admin is asking for us to supply a key identifying ourselves

import os from "os";
import fs from "fs";
import path from "path";

import * as messager from "../modules/messager";

module.exports = function({ header, content, socket }) {

  const pairKeyPath = path.join(os.homedir(), ".xxhost", "pairkey");
  const pairKey = fs.readFileSync(pairKeyPath);

  messager.replyToPeer({ header, content, socket }, {
    header: {},
    content: {
      pairKey
    }
  }, -1, (err) => {
    if (err) throw err;
  });
};
