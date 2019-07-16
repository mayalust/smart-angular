const Packer = require("./packer.js"),
  forceCompile = require("./force-compile"),
  createModuleMap = require("./moduleMap.js");
class Command {
  constructor(config = {}) {
    this.prefix = config.prefix || "ps";
    this.packer = new Packer();
    this.forceCompile = forceCompile();
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
  setMode(mode = "development") {
    this.forceCompile.setMode(mode);
  }
  pack(str, callback, mode) {
    if (typeof str !== "string") {
      throw new Error("invalid input!!");
    }
    let {
      factory,
      path,
      file
    } = this.getFactoryQuery(str),
      moduleMap = createModuleMap();
    moduleMap.reset();
    moduleMap.init(factory, path, file, true).then(moduleList => {
      this.forceCompile.turnOn();
      this.packer.pack(moduleList, nodes => {
        callback && callback.call(this, nodes);
      });
    });
  }
}
module.exports = Command;