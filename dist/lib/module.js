const workPath = process.cwd(),
  pathLib = require("path"),
  psFile = require("ps-file"),
  getFileStateInstance = require("file-state");

function loadFiles(factory, arr) {
  return new Promise((res, rej) => {
    let gen;

    function* loadFilesGen(arr) {
      let rs = [],
        item;
      while (item = arr.shift()) {
        let a = yield loadFn(item);
        [].push.apply(rs, a);
      }
      res(rs);
    }

    function loadFn(item) {
      let f = pathLib.join(workPath, `./${factory}/${item}`);
      psFile(f).children(() => true).then(d => {
        gen.next(d);
      });
    }
    gen = loadFilesGen(arr);
    gen.next();
  });
}

function identify(id, val) {
  return function (d) {
    return d[id] == val;
  }
}

function filterByBaseName(deps) {
  return Promise.resolve(file == null ? deps : deps.filter(identify("basename", file)));
}
class Module {
  constructor(factory, path, file) {
    this.factory = factory;
    this.fileState = getFileStateInstance();
    this.path = path;
    this.file = file;
    this.deps = [];
    this.entry = "";
    this.output = "";
    this.isLoaded = false;
    let explainer = {
      async output() {
        return await loadFiles(factory, ["controllers", "services", "directives", "styles"]);
      },
      "controller.config": async () => {
        return await loadFiles(factory, ["controllers"]);
      },
      async controllers(file) {
        return await loadFiles(factory, ["controllers"]).then(filterByBaseName);
      },
      async services(file) {
        return await loadFiles(factory, ["services"]).then(filterByBaseName);
      },
      async directives(file) {
        return await loadFiles(factory, ["directives"]).then(filterByBaseName);
      }
    }
    let fn = explainer[path];
    this.loaded = fn(file).then(deps => {
      this.deps = deps;
      this.isLoaded = true;
      fileState.setGroup(deps);
      return Promise.resolve(deps);
    });
  }
  isModified() {
    return this.fileState.isModified(this.deps.filter(dep => dep.path));
  }
}
module.exports = Module