// Responds with uptime so we can determine who acts as a server or client

import sharedcache from "../modules/sharedcache";
import * as messager from "../modules/messager";

const xxp = require("xxp");

module.exports = function({ header, content, socket }) {

  // We need a reply before we can add as client
  messager.replyToPeer({ header, content, socket }, {
    header: {},
    content: {
      uptime: new Date().getTime() - sharedcache["starttime"]
    }
  }, -1, (err) => {
    if (err) console.error("Uptime reply error:", err);
  });
};
