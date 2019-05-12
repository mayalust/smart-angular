const getfileStateInstance = require("./filestate.js"),
  Module = require("./module.js");
class Server {
  constructor( config ){
    this.fileStates = getfileStateInstance( config )();
  }
  start( app, factory ){
    this.factory = factory;
    this.fileStates.init( factory );
    app.get(`${factory}/build/controller.config.js`, (req, res) => {
      let module = new Module(this.fileStates);
      module.setDeps( files );
      if( module.isDirty ){
        this.packer.pack( module );
      }
    });
    app.get(`${factory}/build/service.js`, (req, res) => {
      let module = new Module(this.fileStates);
      module.setDeps( files );
    });
    app.get(`${factory}/build/directive.js`, (req, res) => {
      let module = new Module(this.fileStates);
      module.setDeps( files );
    });
    app.get(`${factory}/build/output.js`, (req, res) => {
      let module = new Module(this.fileStates);
      module.setDeps( files );
    });
    app.get(`${factory}/build/controllers/:controller`, (req, res) => {

    });
    app.get(`${factory}/build/services/:service`, (req, res) => {

    });
    app.get(`${factory}/build/directives/:directive`, (req, res) => {

    });
  }
}
module.exports = Server