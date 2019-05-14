const packer = require("./packer.js"), 
  ModuleList = require("./moduleList.js");
class Server {
  constructor( config ){
    this.prefix = config.prefix;
  }
  getFactory( factory ){
    let name = [ factory ];
    if( this.prefix ){
      name.unshift(this.prefix);
    }
    return name.join("-");
  }
  start( app, factory ){
    factory = getFactory( factory );
    app.get(`${factory}/build/controller.config.js`, (req, res) => {
      let modulelist = new ModuleList( factory, "controller.config" );
      packer.pack(modulelist);
    });
    app.get(`${factory}/build/service.js`, (req, res) => {
      let modulelist = new ModuleList( factory, "services" );
      packer.pack(modulelist);
    });
    app.get(`${factory}/build/directive.js`, (req, res) => {
      let modulelist = new ModuleList( factory, "directives" );
      packer.pack(modulelist);
    });
    app.get(`${factory}/build/output.js`, (req, res) => {
      let modulelist = new ModuleList( factory, "output" );
      packer.pack(modulelist);
    });
    app.get(`${factory}/build/controllers/:controller`, (req, res) => {
      let modulelist = new ModuleList( factory, "controllers", "controller");
      packer.pack(modulelist);
    });
    app.get(`${factory}/build/services/:service`, (req, res) => {
      let modulelist = new ModuleList( factory, "services", "service");
      packer.pack(modulelist);
    });
    app.get(`${factory}/build/directives/:directive`, (req, res) => {
      let modulelist = new ModuleList( factory, "directives", "directive");
      packer.pack(modulelist);
    });
  }
}
module.exports = Server