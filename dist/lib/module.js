const _filePath = process.cwd(),
  workPath = getWorkPath(__filename),
  pathLib = require("path"),
  psFile = require("ps-file"),
  MiniCssExtractPlugin = require("mini-css-extract-plugin"),
  {
    angularLoaderPlugin
  } = require("ps-angular-loader"),
  {
    parse
  } = require("querystring"),
  PathMaker = require("./path-maker.js"),
  getFileStateInstance = require("./file-state.js");

function getWorkPath(path) {
  let match = new RegExp("(.*)(?:\\\\|\\/)[^\\/]+$").exec(path);
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
  };

  function check(str) {
    return arr.some(n => tester[n](str));
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
    pathLib.resolve(workPath, `./angular-loader.js`),
    query
  ).getPath();
}
class WebpackModule {
  constructor() {
    this.rules = [{
        test: /\.js$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"]
          }
        }
      },
      {
        test: /\.angular/,
        use: ["ps-angular-loader"]
      },
      {
        test: /\.css$/,
        use: [{
            loader: MiniCssExtractPlugin.loader
          },
          "css-loader"
        ]
      },
      {
        test: /\.less$/,
        use: [{
            loader: MiniCssExtractPlugin.loader
          },
          "css-loader",
          "less-loader"
        ]
      },
      {
        test: /\.(?:scss)|(?:sass)/,
        use: [{
            loader: MiniCssExtractPlugin.loader
          },
          "css-loader",
          "sass-loader"
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use: "url-loader"
      },
      {
        resource: d => {
          return true;
        },
        resourceQuery: query => {
          let pa = parse(query.slice(1));
          return pa.smartangular != null;
        },
        use: {
          loader: pathLib.resolve(workPath, "./loader.js"),
          options: {
            exclude: [/\.test/, /([\\\/])exclude\1/],
            renderWhileStart: true
          }
        }
      }
    ];
  }
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
    this.modules = null;
    this.plugins = null;
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
          path: "output",
          smartangular: null
        });
        this.output = new Output(factory, "output.js");
        this.modules = new WebpackModule();
        this.plugins = [
          new angularLoaderPlugin(), new MiniCssExtractPlugin({
            filename: `output.css`,
            chunkFilename: `[id].css`
          })
        ];
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
          path: "controller.config",
          smartangular: null
        });
        this.output = new Output(factory, "controller.config.js");
        this.modules = new WebpackModule();
        this.plugins = [
          new angularLoaderPlugin()
        ];
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
        this.modules = new WebpackModule();
        this.plugins = [
          new angularLoaderPlugin(),
          new MiniCssExtractPlugin({
            filename: `[name].css`,
            chunkFilename: `[id].css`
          })
        ];
        return files;
      },
      async controllers(file) {
        if (file == null) {
          this.entry = makeEntry({
            factory: factory,
            path: "controllers",
            smartangular: null
          });
          this.output = new Output(factory, "controllers.js");
          this.plugins = [
            new angularLoaderPlugin(), new MiniCssExtractPlugin({
              filename: `controller.css`,
              chunkFilename: `[id].css`
            })
          ];
        } else {
          this.entry = makeEntry({
            factory: factory,
            path: "controllers",
            file: file,
            smartangular: null
          });
          this.output = new Output(factory, "./build/controller", `${file}.js`);
          this.plugins = [
            new angularLoaderPlugin(),
            new MiniCssExtractPlugin({
              filename: `controller.css`,
              chunkFilename: `[id].css`
            })
          ];
        }
        this.modules = new WebpackModule();
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
                file: b.basename,
                smartangular: null
              });
            }
            return a;
          }, {});
        };
        this.output = new Output(factory, "./build/service", `[name].js`);
        this.modules = new WebpackModule();
        this.plugins = [
          new angularLoaderPlugin(),
          new MiniCssExtractPlugin({
            filename: `[name].css`,
            chunkFilename: `[id].css`
          })
        ];
        return files;
      },
      async services(file) {
        if (file == null) {
          this.entry = makeEntry({
            factory: factory,
            path: "services",
            smartangular: null
          });
          this.output = new Output(factory, "services.js");
        } else {
          this.entry = makeEntry({
            factory: factory,
            path: "services",
            file: file,
            smartangular: null
          });
          this.output = new Output(factory, "./build/service", `${file}.js`);
        }
        this.plugins = [
          new angularLoaderPlugin()
        ];
        this.modules = new WebpackModule();
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
                file: b.basename,
                smartangular: null
              });
            }
            return a;
          }, {});
        };
        this.output = new Output(factory, "./build/directive", `[name].js`);
        this.modules = new WebpackModule();
        this.plugins = [
          new angularLoaderPlugin(),
          new MiniCssExtractPlugin({
            filename: `[name].css`,
            chunkFilename: `[id].css`
          })
        ];
        return files;
      },
      async directives(file) {
        if (file == null) {
          this.entry = makeEntry({
            factory: factory,
            path: "directives",
            smartangular: null
          });
          this.output = new Output(factory, "directives.js");
        } else {
          this.entry = makeEntry({
            factory: factory,
            path: "directives",
            file: file,
            smartangular: null
          });
          this.output = new Output(factory, "./build/directive", `${file}.js`);
        }
        this.modules = new WebpackModule();
        this.plugins = [
          new angularLoaderPlugin(),
          new MiniCssExtractPlugin({
            filename: `directive.css`,
            chunkFilename: `[id].css`
          })
        ];
        return await loadFiles(factory, ["directives"]).then(
          filterByBaseName(file)
        );
      },
      async styles(file) {
        this.entry = makeEntry({
          factory: factory,
          path: "styles",
          smartangular: null
        });
        this.output = new Output(factory, "style.css");
        this.modules = new WebpackModule();
        this.plugins = [
          new angularLoaderPlugin(),
          new MiniCssExtractPlugin({
            filename: `style.css`,
            chunkFilename: `[id].css`
          })
        ];
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
      return Promise.resolve(deps);
    });
  }
  isModified() {
    if (this.deps.length == 1) {
      let a = this.fileState.isModified([this.deps[0].path]);
      if (a) {
        let b = this.fileState.get(this.deps[0].path);
        //console.log(b);
      }
    }
    let rs = this.fileState.isModified(this.deps.map(dep => dep.path));
    if (this.deps.length > 4) {
      let c = this.fileState.get(this.deps[4].path);
      //console.log(c);
    }
    return rs;
  }
}
module.exports = Module;