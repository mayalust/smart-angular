const packer = require("./packer.js"),
  moduleList = require("./moduleList.js");
class Command {
  constructor(config = {}) {
    this.prefix = config.prefix || "ps";
  }
  getFactory(factory) {
    let name = [factory];
    if (this.prefix) {
      name.unshift(this.prefix);
    }
    return name.join("-");
  }
  getFactoryQuery(str) {
    let arr = str.split("/");
    return {
      factory: this.getFactory(arr[0]),
      path: arr[1],
      file: arr[2]
    };
  }
  pack(str) {
    if (typeof str !== "string") {
      throw new Error("invalid input!!");
    }
    let {
      factory,
      path,
      file
    } = getFactoryQuery(str);
    moduleList = new moduleList(factory, path, file);
    packer.pack(moduleList, nodes => {
      console.log(nodes);
    });
  }
}
module.exports = Command;