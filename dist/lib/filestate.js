let psfile = require("ps-file");
const workpath = process.cwd();
const pathLib = require("path");
class FileStates {
  constructor( config ){
    for( let i in config ){
      this[i] = config[i];
    };
    this.filesMap = new Map;
  }
  load( factory, arr ){
    function loadFile( dir ){
      return psfile(pathLib.resolve(workpath,`./${ factory }` ,`./${dir}`))
        .children();
    }
    return Promise.all(arr.map(loadFile)).then( files => {
      return Promise.resolve( files.reduce((a,b)=> {
        return a.concat(b);
      }, []));
    });
  }
}
function getfileStateInstance( config ){
  let instance;
  return function(){
    if( instance == null) {
      instance = new FileStates( config )
    }
    return instance;
  }

}
module.exports = getfileStateInstance;