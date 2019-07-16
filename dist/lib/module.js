const _filePath = process.cwd(),
  dir = process.cwd(),
  forceCompile = require("./force-compile"),
  workPath = getWorkPath(__filename),
  getAssetInstance = require("./asset.js"),
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

function toObject(arr, fn) {
  let rs = {};
  for (let i = 0; i < arr.length; i++) {
    let obj = fn(arr[i], i);
    rs[obj[0]] = obj[1];
  }
  return rs;
}

function recursiveIssuer(m) {
  if (m.issuer) {
    return recursiveIssuer(m.issuer);
  } else if (m.name) {
    return m.name;
  } else {
    return false;
  }
}

function basedOnEntry({
  basename
}) {
  return [
    basename + "Styles", {
      name: basename,
      test: (m, c, entry) => {
        entry = entry || basename;
        let rs = m.constructor.name === 'CssModule' && recursiveIssuer(m) === entry;
        return rs;
      },
      chunks: 'all',
      enforce: true,
    }
  ]
}

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
    templates(ext) {
      return ext == "template";
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
        test: /\.angular$/,
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
    this.publicPath = '/';
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
    this.forceCompile = forceCompile();
    this.assets = getAssetInstance();
    this.fileState = getFileStateInstance();
  }
  makeOptimizationByDeps() {
    return {
      splitChunks: {
        cacheGroups: toObject(this.deps, basedOnEntry)
      }
    }
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
      async template() {
        this.entry = makeEntry({
          factory: factory,
          path: "template",
          smartangular: null
        });
        this.output = new Output(factory, "template.config.js");
        this.modules = new WebpackModule();
        this.plugins = [
          new angularLoaderPlugin()
        ];
        return await loadFiles(factory, ["templates"]);
      },
      async allControllers() {
        let files = await loadFiles(factory, ["controllers"]);
        this.entry = () => {
          if (this.deps.length == 0) {
            return;
          }
          return this.deps.reduce((a, b) => {
            if (this.file == null || this.file == b.basename) {
              a[b.basename] = makeEntry({
                factory: factory,
                path: "controllers",
                file: b.basename,
                smartangular: null
              });
            }
            return a;
          }, {});
        };
        this.output = new Output(factory, "./build/controller", `[name].js`);
        this.modules = new WebpackModule();
        this.optimization = () => {
          return this.makeOptimizationByDeps();
        };
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
          this.output = new Output(factory, "controller.js");
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
          if (this.deps.length == 0) {
            return;
          }
          return this.deps.reduce((a, b) => {
            if (this.file == null || this.file == b.basename) {
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
        /* this.optimization = () => {
          return this.makeOptimizationByDeps();
        }; */
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
          this.output = new Output(factory, "service.js");
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
          if (this.deps.length == 0) {
            return;
          }
          return this.deps.reduce((a, b) => {
            if (this.file == null || this.file == b.basename) {
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
        this.optimization = () => {
          return this.makeOptimizationByDeps();
        };
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
          this.output = new Output(factory, "directive.js");
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
        this.output = new Output(factory, "style.js");
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
    if (this.forceCompile.value()) {
      return true;
    }
    return this.fileState.isModified(this.deps.map(dep => dep.path));
  }
  getId() {
    return [this.factory, this.path, this.file].filter(d => d).join("/");
  }
  getUpdatedAsset(callback) {
    this.getAsset(callback, true)
  }
  getAsset(callback) {
    let id = this.getId(),
      asset = {};
    if (this.forceCompile.value() == true) {
      console.info(`-------- [成功(模块)] 命令行输入:${id}，不需要返回值`);
      return callback();
    }
    if (this.isModified() && this.assets.get(id) != null) {
      console.info(`-------- [成功(模块)] 从缓存获取:${id}`);
      return callback(this.assets.get(id));
    }
    let arr = [this.factory, "build"];
    if (this.path != null) {
      if (["controllers", "directives", "services", "styles"].indexOf(this.path) != -1) {
        arr.push(this.path.substring(0, this.path.length - 1));
      } else if (["allControllers", "allDirectives", "allServices"].indexOf(this.path) != -1) {
        arr.push(this.path.substring(3, this.path.length - 1).toLowerCase());
      } else {
        arr.push(this.path);
      }
    }
    if (this.file != null) {
      arr.push(this.file);
    }
    let jsId = pathLib.resolve(dir, "./" + arr.join("/") + ".js"),
      cssId = pathLib.resolve(dir, "./" + arr.join("/") + ".css");
    psFile(jsId).read().then(d => {
      asset.js = d.toString();
      return psFile(cssId).read();
    }).then(d => {
      asset.css = d.toString();
      this.assets.add(id, asset);
      console.info(`-------- [成功(模块)] 文件缓存中找不到对应资源,从文件[${id}]读取信息`);

      callback(asset);
    }).catch(e => {
      this.assets.add(id, asset);
      console.info(`-------- [错误(模块)] 找不到对应文件，或文件加载错误,跳过从[${id}]读取信息`);
      callback(asset);
    })
  }
}
module.exports = Module;