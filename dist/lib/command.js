const packer = require("./packer.js"),
  moduleList = require("./moduleList.js");
class Command {
  constructor(config) {
    this.prefix = config.prefix;
  }
  getFactory(factory) {
    let name = [factory];
    if (this.prefix) {
      name.unshift(this.prefix);
    }
    return name.join("-");
  }
  pack(str) {
    if (typeof str !== "string") {
      throw new Error("invalid input!!");
    }
    let arr = str.split("/"),
      factory = getFactory(arr[0]),
      path = arr[1],
      file = arr[2];
    moduleList = new moduleList(factory, path, file);
    packer.pack(moduleList);
  }
}
module.exports = Command;