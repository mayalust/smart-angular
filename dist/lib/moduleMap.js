const Module = require("./module.js"),
  getFileStateInstance = require("./file-state.js");

function toUpper(str) {
  return str[0].toUpperCase() + str.substring(1);
}
class MakeConfig {
  constructor(factory, path, file) {
    const OldDics = {
        "config": "controller.config",
        "config.controller": "controller.config",
        "config.template": "template.config"
      },
      Old = ["controller", "service", "directive", "style"],
      Normal = ["output", "controller.config", "controllers", "services", "directives", "styles", "template"],
      All = ["allControllers", "allServices", "allDirectives"];
    this.factory = factory;
    path = OldDics[path] || path;
    if (path == null || path == "*") {
      this.path = Normal.concat(All);
      return;
    }
    if (Old.indexOf(path) != -1) {
      path += "s";
    }
    if (Normal.indexOf(path) == -1) {
      throw new Error(`unknown path input [${path}], please select from [${Normal.join(",")}]`);
    }
    if (All.indexOf(path) != -1) {
      throw new Error(`please use for instance "controllers/* instead."`);
    }
    this.path = file != null ? [`all${toUpper(path)}`] : [path];
    this.file = file;
  }
}
class ModuleMap {
  constructor() {
    this.fileState = getFileStateInstance();
    this.moduleMap = {};
    this.ALL = Symbol("ALL");
  }
  reset() {
    this.fileState.clear();
  }
  init(fa, pa, fi) {
    let {
      factory,
      path,
      file
    } = new MakeConfig(fa, pa, fi),
      moduleList = path.map(p => {
        return this.attr(factory, p, file) || new Module(factory, p, file);
      });
    return Promise.all(moduleList.map(module => module.init())).then(depsGroup => {
      let combineIds = depsGroup.reduce((a, b) => {
        b.forEach(n => {
          a[n.path] = n;
        });
        return a;
      }, {});
      this.fileState.setGroup(Object.values(combineIds));
      return Promise.resolve(moduleList)
    })
  }
  attr(p1, p2, p3, d) {
    let obj = this.moduleMap;
    if (d == null) {
      if (obj[p1] == null) {
        return null
      }
      obj = obj[p1]
      if (obj[p2] == null) {
        return null
      }
      obj = obj[p2]
      if (obj[p3] == null) {
        return null
      }
      return obj[p3]
    }
    obj = obj[p1] - obj[p1] || {};
    obj = obj[p2] - obj[p2] || {};
    obj[p3] = d;
  }
}

function createModuleMap() {
  let instance;
  return function () {
    if (instance != null) {
      return instance;
    }
    instance = new ModuleMap;
    return instance;
  }
}
module.exports = createModuleMap()