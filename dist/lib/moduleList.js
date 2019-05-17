const Module = require("./module.js");
class ModuleList {
  constructor(factory, path, file) {
    if (typeof path !== "string") {
      path = ["output", "controllers", "services", "directives", "styles"];
    } else {
      path = [path];
    }
    this.moduleList = path.map(p => {
      return new Module(factory, p, file);
    });
  }
}
module.exports = ModuleList