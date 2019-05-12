const getfileStateInstance = require("./filestate.js");
class Module {
  constructor(factory, path, file){
    this.factory = factory;
    this.filestate = getfileStateInstance( factory )();
    this.path = path;
    this.file = file;
    this.deps = [];
    this.entry = "";
    this.output = "";
    let explainer = {
      "output" : () => {
        return this.filestate.load(factory, ["controllers", "services", "directives", "styles"]);
      },
      "controller.config" : () => {
        return this.filestate.load(factory, ["controllers"]);
      },
      "controllers" : ( file ) => {
        if( file == null ){
          return this.filestate.load(factory, ["controllers"]);
        } else {
          return this.filestate.load(factory, ["controllers"]).then( files => {
            return Promise.resolve( files.filter( file => file.basename == file));
          })
        }
      },
      "services" : ( file ) => {
        if( file == null ){
          return this.filestate.load(factory, ["services"]);
        } else {
          return this.filestate.load(factory, ["services"]).then( files => {
            return Promise.resolve( files.filter( file => file.basename == file ));
          })
        }
      },
      "directives" : ( file ) => {
        if( file == null ){
          return this.filestate.load(["directives"])
        } else {
          return this.filestate.load(["directives"]).then( files => {
            return Promise.resolve( files.filter( file => file.basename == file ));
          })
        }
      }
    }
    let fn = explainer[path];
    this.loaded = fn( file ).then( deps => {
      this.deps = deps;
      return Promise.resolve( deps );
    });
  }
}
module.exports = Module