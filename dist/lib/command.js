const Packer = require("./packer.js"),
  moduleList = require("./moduleList.js");
class Command {
  constructor(config = {}) {
    this.prefix = config.prefix || "ps";
    this.packer = new Packer();
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
    } = this.getFactoryQuery(str),
      moduleListIns = new moduleList(factory, path, file);
    moduleListIns.allLoaded.then(() => {
      this.packer.pack(moduleListIns.moduleList, nodes => {});
    })
  }
}
module.exports = Command;