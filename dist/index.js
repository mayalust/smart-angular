const {
  extend,
  getFilePath,
  isArray,
  isFunction,
  tree,
  random,
  eachProp
} = require("ps-ultility"),
  Server = require("./lib/server.js"),
  Command = require("./lib/Command.js");
class smartAngular {
  constructor() {
    let config = {
      "prefix": "ps"
    }
    this.server = new Server(config);
    this.command = new Command(config);
  }
  pack(str) {
    this.command.pack(str);
  }
  start(app, factory) {
    this.server.start(factory);
  }
}
module.exports = new smartAngular;