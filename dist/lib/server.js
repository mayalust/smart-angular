const packer = require("./packer.js"),
  ModuleList = require("./moduleList.js");
class Server {
  constructor(config) {
    this.prefix = config.prefix;
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
      let moduleList = new ModuleList(factory, "controller.config");
      packer.pack(moduleList);
    });
    app.get(`${factory}/build/service.js`, (req, res) => {
      let moduleList = new ModuleList(factory, "services");
      packer.pack(moduleList);
    });
    app.get(`${factory}/build/directive.js`, (req, res) => {
      let moduleList = new ModuleList(factory, "directives");
      packer.pack(moduleList);
    });
    app.get(`${factory}/build/output.js`, (req, res) => {
      let moduleList = new ModuleList(factory, "output");
      packer.pack(moduleList);
    });
    app.get(`${factory}/build/controllers/:controller`, (req, res) => {
      let moduleList = new ModuleList(factory, "controllers", "controller");
      packer.pack(moduleList);
    });
    app.get(`${factory}/build/services/:service`, (req, res) => {
      let moduleList = new ModuleList(factory, "services", "service");
      packer.pack(moduleList);
    });
    app.get(`${factory}/build/directives/:directive`, (req, res) => {
      let moduleList = new ModuleList(factory, "directives", "directive");
      packer.pack(moduleList);
    });
  }
}
module.exports = Server