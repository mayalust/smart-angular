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
  Command = require("./lib/command.js");
class smartAngular {
  constructor() {
    let config = {
      "prefix": "ps"
    }
    this.ser = new Server(config);
    this.command = new Command(config);
  }
  server(app, factory) {
    this.ser.start(app, factory);
  }
  pack(str) {
    this.command.pack(str);
  }
}
let sangular = new smartAngular;
module.exports = {
  server(app, factory) {
    sangular.server(app, factory);
  },
  pack(str) {
    sangular.pack(str);
  }
};