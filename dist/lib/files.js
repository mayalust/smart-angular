const pathLib = require("path");
let fileslist = [],
  workpath = process.cwd(),
  psfile = require("ps-file");
function isPromise( obj ){
  return typeof obj === "object" && obj !== null &&  typeof obj.then == "function";
}
class files {
  constructor() {
    this.files = null;
  }
  readFiles( name ){
    let basepath = pathLib.resolve(workpath, `./ps-${ name }/`)
    this.files = psfile(pathLib.resolve(basepath)).children( node => {
      return node.ext === "directive" || node.ext === "service"
    })
  }
  getFiles(){
    return isPromise( this.files )
      ? this.files : Promise.resolve()
  }
}
module.exports = new files