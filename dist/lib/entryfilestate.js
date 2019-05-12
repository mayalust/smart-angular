let psfile = require("ps-file");
class EntryFileStates {
  constructor( config ){
    for( let i in config ){
      this[i] = config[i];
    };
    this.filesMap = new Map;
    this.structor = {
      output : ["output"],
      controllers : function(){

      }
    }
  }
  getEntry( factory, path, file ){
    if( !factory ){
      throw new Error("please asign a factory name!!");
    };
  }
  getDeps(){

  }
  update(){

  }
}
function getentryfileStateInstance( config ){
  let instance;
  return function(){
    if( instance == null) {
      instance = new FileStates( config )
    }
    return instance;
  }

}
module.exports = getentryfileStateInstance;