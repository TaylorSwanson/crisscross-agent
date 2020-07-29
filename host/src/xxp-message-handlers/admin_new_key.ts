// Admin is sending a new key for us to use to authenticate with later

import os from "os";
import fs from "fs";
import path from "path";

import * as messager from "../modules/messager";

import md5 from "../utils/static/md5";

module.exports = function({ header, content, socket }) {
  
  const pairKeyPath = path.join(os.homedir(), ".xxhost", "pairkey");
  
  let pairKey = "";
  try {
    pairKey = fs.readFileSync(pairKeyPath).toString("utf8");
  } catch (e) {
    //
  }

  messager.replyToPeer({ header, content, socket }, {
    header: {},
    content: {
      pairKey: md5(pairKey, "utf8")
    }
  }, -1, (err) => {
    if (err) throw err;
    
    // Destroy on our end too (no ddos)
    socket.end();
    socket.destroy();
  });
};
