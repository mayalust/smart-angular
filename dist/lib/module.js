const _filePath = process.cwd(),
  workPath = getWorkPath(__filename),
  pathLib = require("path"),
  psFile = require("ps-file"),
  PathMaker = require("./path-maker.js");
getFileStateInstance = require("./file-state.js");

function getWorkPath(path) {
  let match = new RegExp("(.*)(?:\\\\|\\/)[^\\\/]+$").exec(path);
  if (match == null) {
    throw new Error("__workPath is invalid!");
  }
  return match[1];
}

function loadFiles(factory, arr) {
  let tester = {
    controllers(ext) {
      return ext == "controller";
    },
    services(ext) {
      return ext == "service";
    },
    directives(ext) {
      return ext == "directive";
    },
    styles(ext) {
      return new RegExp("css|less|scss|sass").test(ext);
    }
  }

  function check(str) {
    return arr.some(n => tester[n](str))
  }
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

    function noExclude(path) {
      return !RegExp("(\\\\|\\/)exclude(?:d)?\\1").test(path);
    }

    function loadFn(item) {
      let f = pathLib.join(_filePath, `./${factory}/${item}`);
      psFile(f)
        .children(n => {
          return !n.isDir && check(n.ext) && noExclude(n.path);
        })
        .then(d => {
          gen.next(d);
        });
    }
    gen = loadFilesGen(arr.slice());
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
  constructor(factory, filePath, fileName) {
    if (fileName == null) {
      fileName = filePath;
      filePath = "./build";
    }
    this.path = pathLib.resolve(_filePath, factory, filePath);
    this.filename = fileName;
  }
}
class Module {
  constructor(factory, path, file) {
    this.deps = [];
    this.entry = "";
    this.output = "";
    this.factory = factory;
    this.path = path;
    this.file = file;
    this.fileState = getFileStateInstance();
  }
  init() {
    let {
      factory,
      path,
      file
    } = this;
    this.isLoaded = false;
    let explainer = {
      async output() {
        this.entry = makeEntry({
          factory: factory,
          path: "output"
        });
        this.output = new Output(factory, "output.js");
        return await loadFiles(factory, [
          "controllers",
          "services",
          "directives",
          "styles"
        ]);
      },
      "controller.config": async () => {
        this.entry = makeEntry({
          factory: factory,
          path: "config"
        });
        this.output = new Output(factory, "controller.config.js");
        return await loadFiles(factory, ["controllers"]);
      },
      async allControllers() {
        let files = await loadFiles(factory, ["controllers"]);
        this.entry = () => {
          return this.deps.reduce((a, b) => {
            if (this.fileState.isModified(b.path)) {
              a[b.basename] = makeEntry({
                factory: factory,
                path: "controllers",
                file: b.basename
              });
            }
            return a;
          }, {});
        };
        this.output = new Output(factory, "./build/controller", `[name].js`);
        return files;
      },
      async controllers(file) {
        if (file == null) {
          this.entry = makeEntry({
            factory: factory,
            path: "controllers"
          });
          this.output = new Output(factory, "controllers.js");
        } else {
          this.entry = makeEntry({
            factory: factory,
            path: "controllers",
            file: file
          });
          this.output = new Output(factory, "./build/controller", `${file}.js`);
        }
        return await loadFiles(factory, ["controllers"]).then(
          filterByBaseName(file)
        );
      },
      async allServices() {
        let files = await loadFiles(factory, ["services"]);
        this.entry = () => {
          return this.deps.reduce((a, b) => {
            if (this.fileState.isModified(b.path)) {
              a[b.basename] = makeEntry({
                factory: factory,
                path: "services",
                file: b.basename
              });
            }
            return a;
          }, {});
        };
        this.output = new Output(factory, "./build/service", `[name].js`);
        return files;
      },
      async services(file) {
        if (file == null) {
          this.entry = makeEntry({
            factory: factory,
            path: "services"
          });
          this.output = new Output(factory, "services.js");
        } else {
          this.entry = makeEntry({
            factory: factory,
            path: "services",
            file: file
          });
          this.output = new Output(factory, "./build/service", `${file}.js`);
        }
        return await loadFiles(factory, ["services"]).then(
          filterByBaseName(file)
        );
      },
      async allDirectives() {
        let files = await loadFiles(factory, ["directives"]);
        this.entry = () => {
          return this.deps.reduce((a, b) => {
            if (this.fileState.isModified(b.path)) {
              a[b.basename] = makeEntry({
                factory: factory,
                path: "directives",
                file: b.basename
              });
            }
            return a;
          }, {});
        };
        this.output = new Output(factory, "./build/directive", `[name].js`);
        return files;
      },
      async directives(file) {
        if (file == null) {
          this.entry = makeEntry({
            factory: factory,
            path: "directives"
          });
          this.output = new Output(factory, "directives.js");
        } else {
          this.entry = makeEntry({
            factory: factory,
            path: "directives",
            file: file
          });
          this.output = new Output(factory, "./build/directive", `${file}.js`);
        }
        return await loadFiles(factory, ["directives"]).then(
          filterByBaseName(file)
        );
      },
      async styles(file) {
        this.entry = makeEntry({
          factory: factory,
          path: "styles"
        });
        this.output = new Output(factory, "style.css");
        return await loadFiles(factory, ["styles"]).then(
          filterByBaseName(file)
        );
      }
    };
    let fn = explainer[path];
    if (fn == null) {
      throw new Error(`${path} cannot be found!`);
    }

    return fn.call(this, file).then(deps => {
      this.deps = deps;
      this.isLoaded = true;
      this.fileState.setGroup(deps);
      return Promise.resolve(deps);
    });
  }
  isModified() {
    return this.fileState.isModified(this.deps.map(dep => dep.path));
  }
}
module.exports = Module;