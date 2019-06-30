const Packer = require("./packer.js"),
  createModuleMap = require("./moduleMap.js");
class Explainer {
  constructor() {
    this.fnList = new Map();
    this.packer = new Packer();
    this.moduleMap = createModuleMap();
    this.add(`\\/build\\/controller\\.config\\.js$`, (match, callback) => {
      this.moduleMap
        .init(this.factory, "controller.config")
        .then(moduleList => {
          this.packer.pack(moduleList, asset => {
            callback && callback.call(this, ["js", asset[0]["js"]]);
          });
        });
    });
    this.add(`\\/build\\/template\\.js$`, (match, callback) => {
      this.moduleMap
        .init(this.factory, "template")
        .then(moduleList => {
          this.packer.pack(moduleList, asset => {
            callback && callback.call(this, ["js", asset[0]["js"]]);
          });
        });
    });
    this.add(`\\/build\\/output\\.(js|css)$`, (match, callback) => {
      this.moduleMap.init(this.factory, "output").then(moduleList => {
        this.packer.pack(moduleList, asset => {
          callback && callback.call(this, [match[1], asset[0][match[1]]]);
        });
      });
    });
    this.add(`\\/build\\/controller\\.(js|css)$`, (match, callback) => {
      this.moduleMap.init(this.factory, "controller").then(moduleList => {
        this.packer.pack(moduleList, asset => {
          callback && callback.call(this, [match[1], asset[0][match[1]]]);
        });
      });
    });
    this.add(
      `\\/build\\/controller\\/([^.]+)\\.(js|css)$`,
      (match, callback) => {
        this.moduleMap
          .init(this.factory, "controller", match[1])
          .then(moduleList => {
            this.packer.pack(moduleList, asset => {
              callback && callback.call(this, [match[2], asset[0][match[2]]]);
            });
          });
      }
    );
    this.add(`\\/build\\/service\\.js$`, (match, callback) => {
      this.moduleMap.init(this.factory, "service").then(moduleList => {
        this.packer.pack(moduleList, asset => {
          callback && callback.call(this, ["js", asset[0]["js"]]);
        });
      });
    });
    this.add(`\\/build\\/service\\/([^.]+)\\.(js|css)$`, (match, callback) => {
      this.moduleMap
        .init(this.factory, "service", match[1])
        .then(moduleList => {
          this.packer.pack(moduleList, asset => {
            callback && callback.call(this, [match[2], asset[0][match[2]]]);
          });
        });
    });
    this.add(`\\/build\\/directive\\.(js|css)$`, (match, callback) => {
      this.moduleMap.init(this.factory, "directive").then(moduleList => {
        this.packer.pack(moduleList, asset => {
          callback && callback.call(this, asset[0][match[1]]);
        });
      });
    });
    this.add(
      `\\/build\\/directive\\/([^.]+)\\.(js|css)$`,
      (match, callback) => {
        this.moduleMap
          .init(this.factory, "directive", match[1])
          .then(moduleList => {
            this.packer.pack(moduleList, asset => {
              callback && callback.call(this, [match[2], asset[0][match[2]]]);
            });
          });
      }
    );
    this.add(`\\/build\\/style\\.css$`, (match, callback) => {
      this.moduleMap.init(this.factory, "style").then(moduleList => {
        this.packer.pack(moduleList, asset => {
          callback && callback.call(this, ["css", asset[0]["css"]]);
        });
      });
    });
  }
  setFactory(factory) {
    this.factory = factory;
  }
  add(exp, fn) {
    this.fnList.set(exp, fn);
  }
  check(url, callback) {
    let gen = this.fnList.entries(),
      factory = this.factory;

    function checkList() {
      let {
        done,
        value
      } = gen.next();
      if (!done) {
        let key = value[0],
          fn = value[1],
          match = new RegExp(factory + key).exec(url);
        if (match) {
          fn(match, d => {
            callback(d);
          });
        } else {
          checkList();
        }
      } else {
        callback();
      }
    }
    checkList();
  }
}

class Server {
  constructor(config) {
    this.prefix = config ? config.prefix : "ps";
    this.explainer = new Explainer();
    this.moduleMap = createModuleMap();
  }
  getFactory(factory) {
    let name = [factory];
    if (this.prefix) {
      name.unshift(this.prefix);
    }
    return name.join("-");
  }
  renderFile(url, callback) {
    this.explainer.check(url, callback);
  }
  start(app, factory) {
    factory = this.getFactory(factory);
    this.explainer.setFactory(factory);
    app &&
      app.use((req, res, next) => {
        let url = req.url;
        this.renderFile(url, (content) => {
          if (!content) {
            return next();
          }
          let type = content[0],
            code = content[1];
          if (type == "js") {
            res.setHeader("Content-Type", "application/javascript;charset=UTF-8");
          } else if (type == "css") {
            res.setHeader("Content-Type", "text/css");
          }
          res.write(code);
          res.end();
        });
      });
  }
}
module.exports = Server;