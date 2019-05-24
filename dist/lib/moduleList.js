const Module = require("./module.js");

function toUpper(str) {
  return str[0].toUpperCase() + str.substring(1);
}
class MakeConfig {
  constructor(factory, path, file) {
    const Normal = ["output", "controllers", "services", "directives", "styles"],
      All = ["allControllers", "allServices", "allDirectives"];
    this.factory = factory;
    if (path == null || path == "*") {
      this.path = Normal.concat(All);
      return;
    }
    if (Normal.indexOf(path) == -1) {
      throw new Error(`unknown path input [${path}], please select from [${Normal.join(",")}]`);
    }
    if (All.indexOf(path) != -1) {
      throw new Error(`please use for instance "controllers/* instead."`);
    }
    this.path = files == "*" ? [`all${toUpper(path)}`] : [path];
  }
}
class ModuleList {
  constructor(fa, pa, fi) {
    let {
      factory,
      path,
      file
    } = new MakeConfig(fa, pa, fi);
    this.moduleList = path.map(p => {
      return new Module(factory, p, file);
    });
    this.allLoaded = Promise.all(this.moduleList.map(module => module.loaded));
  }
}
module.exports = ModuleList