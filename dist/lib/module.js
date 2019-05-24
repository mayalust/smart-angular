const _filePath = process.cwd(),
  workPath = getWorkPath(__filename),
  pathLib = require("path"),
  psFile = require("ps-file"),
  PathMaker = require("./path-maker.js"),
  getFileStateInstance = require("./file-state.js")();

function getWorkPath(path) {
  let match = new RegExp("(.*)(?:\\\\|\\/)[^\\\/]+$").exec(path);
  if (match == null) {
    throw new Error("__workPath is invalid!");
  }
  return match[1];
}

function loadFiles(factory, arr) {
  return new Promise((res, rej) => {
    let gen;

    function* loadFilesGen(arr) {
      let rs = [],
        item;
      while ((item = arr.shift())) {
        let a = yield loadFn(item);
        [].push.apply(rs, a);
      }
      res(rs);
    }

    function loadFn(item) {
      let f = pathLib.join(_filePath, `./${factory}/${item}`);
      psFile(f)
        .children(() => true)
        .then(d => {
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
  };
}

function filterByBaseName(file) {
  return function (deps) {
    return Promise.resolve(
      file == null ? deps : deps.filter(identify("basename", file))
    );
  };
}

function makeEntry(query) {
  return new PathMaker(
    pathLib.resolve(workPath, `./loaders/angular-loader.js`),
    query
  ).getPath();
}
class Output {
  constructor(filePath, fileName) {
    if (fileName == null) {
      fileName = filePath;
      filePath = "./build";
    }
    this.path = pathLib.resolve(_filePath, filePath);
    this.filename = fileName;
  }
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
        this.entry = makeEntry({
          path: "output"
        });
        this.output = new Output("output.js");
        return await loadFiles(factory, [
          "controllers",
          "services",
          "directives",
          "styles"
        ]);
      },
      "controller.config": async () => {
        this.entry = makeEntry({
          path: "config"
        });
        this.output = new Output("controller.config.js");
        return await loadFiles(factory, ["controllers"]);
      },
      async allControllers() {
        let files = await loadFiles(factory, ["controllers"]);
        this.entry = function _makeEntry() {
          this.entry = files.reduce((a, b) => {
            if (b.isModified()) {
              a[b.basename] = makeEntry({
                path: "controllers",
                file: b.basename
              });
            }
            return a;
          });
        };
        this.output = new Output("./build/controllers", `[name].js`);
        return files;
      },
      async controllers(file) {
        if (file == null) {
          this.entry = makeEntry({
            path: "controllers",
            file: file
          });
          this.output = new Output("controllers.js");
        } else {
          this.entry = makeEntry({
            path: "controllers",
            file: file
          });
          this.output = new Output("./build/controllers", `${file}.js`);
        }
        return await loadFiles(factory, ["controllers"]).then(
          filterByBaseName(file)
        );
      },
      async allServices() {
        let files = await loadFiles(factory, ["services"]);
        this.entry = function _makeEntry() {
          return files.reduce((a, b) => {
            if (b.isModified()) {
              a[b.basename] = makeEntry({
                path: "services",
                file: b.basename
              });
            }
            return a;
          });
        }
        this.output = new Output("./build/services", `[name].js`);
        return files;
      },
      async services(file) {
        this.entry = makeEntry({
          path: "services",
          file: file
        });
        return await loadFiles(factory, ["services"]).then(
          filterByBaseName(file)
        );
      },
      async allDirectives() {
        let files = await loadFiles(factory, ["directives"]);
        this.entry = function _makeEntry() {
          return files.reduce((a, b) => {
            if (b.isModified()) {
              a[b.basename] = makeEntry({
                path: "directives",
                file: b.basename
              });
            }
            return a;
          });
        }
        this.output = new Output("./build/directives", `[name].js`);
        return files;
      },
      async directives(file) {
        this.entry = makeEntry({
          path: "directives",
          file: file
        });
        return await loadFiles(factory, ["directives"]).then(
          filterByBaseName(file)
        );
      },
      async styles(file) {
        this.entry = makeEntry({
          path: "styles",
          file: file
        });
        return await loadFiles(factory, ["styles"]).then(
          filterByBaseName(file)
        );
      }
    };
    let fn = explainer[path];
    if (fn == null) {
      throw new Error(`${path} cannot be found!`);
    }

    this.loaded = fn.call(this, file).then(deps => {
      this.deps = deps;
      this.isLoaded = true;
      this.fileState.setGroup(deps);
      return Promise.resolve(deps);
    });
  }
  isModified() {
    return this.fileState.isModified(this.deps.filter(dep => dep.path));
  }
}
module.exports = Module;