const packer = require("./packer.js"),
  createModuleMap = require("./moduleMap.js");
class Server {
  constructor(config) {
    this.prefix = config.prefix;
    this.moduleMap = createModuleMap();
  }
  getFactory(factory) {
    let name = [factory];
    if (this.prefix) {
      name.unshift(this.prefix);
    }
    return name.join("-");
  }
  start(app, factory) {
    factory = getFactory(factory);
    app.get(`${factory}/build/controller.config.js`, (req, res) => {
      this.moduleMap.init(factory, "controller.config").then(moduleList => {
        this.packer.pack(moduleList, nodes => {});
      });
    });
    app.get(`${factory}/build/service.js`, (req, res) => {
      this.moduleMap.init(factory, "services").then(moduleList => {
        this.packer.pack(moduleList, nodes => {});
      });
    });
    app.get(`${factory}/build/directive.js`, (req, res) => {
      this.moduleMap.init(factory, "directives").then(moduleList => {
        this.packer.pack(moduleList, nodes => {});
      });
    });
    app.get(`${factory}/build/output.js`, (req, res) => {
      this.moduleMap.init(factory, "output").then(moduleList => {
        this.packer.pack(moduleList, nodes => {});
      });
    });
    app.get(`${factory}/build/controllers/:controller`, (req, res) => {
      let file = "controller"
      this.moduleMap.init(factory, "controllers", file).then(moduleList => {
        this.packer.pack(moduleList, nodes => {});
      });
    });
    app.get(`${factory}/build/services/:service`, (req, res) => {
      let file = "service"
      this.moduleMap.init(factory, "services", file).then(moduleList => {
        this.packer.pack(moduleList, nodes => {});
      });
    });
    app.get(`${factory}/build/directives/:directive`, (req, res) => {
      let file = "directive"
      this.moduleMap.init(factory, "directives", file).then(moduleList => {
        this.packer.pack(moduleList, nodes => {});
      });
    });
  }
}
module.exports = Server