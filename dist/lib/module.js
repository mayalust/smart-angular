const workpath = process.cwd();
const pathLib = require("path");
const psfile = require("ps-file");
function loadFiles(factory, arr){
  return new Promise((res, rej)=> {
    let gen;
    function *loadFilesGen( arr ){
      let rs = [];
      while( arr.length > 0 ){
        let a = yield loadf( arr );
        [].push.apply(rs, a);
      }
      res( rs );
    }
    function loadf(arr){
      let item = arr.shift();
      let f = pathLib.join(workpath,`./${factory}/${item}`);
      psfile(f).children(()=>true).then( d => {
        gen.next(d);
      });
    }
    gen = loadFilesGen(arr);
    gen.next();
  });
}
function identify( id, val ){
  return function( d ){
    return d[id] == val;
  }
}
class Module {
  constructor(factory, path, file){
    this.factory = factory;
    this.path = path;
    this.file = file;
    this.deps = [];
    this.entry = "";
    this.output = "";
    this.isLoaded = false;
    let explainer = {
      async output() {
        return await loadFiles(factory, ["controllers", "services", "directives", "styles"]);
      },
      "controller.config" : async () => {
        return await loadFiles(factory, ["controllers"]);
      },
      async controllers( file ){
        return await loadFiles(factory, ["controllers"]).then( deps => {
          return Promise.resolve( file == null ? deps : deps.filter(identify("basename", file)));
        });
      },
      async services( file ){
        return await loadFiles(factory, ["services"]).then( deps => {
          return Promise.resolve( file == null ? deps : deps.filter(identify("basename", file)));
        });
      },
      async directives( file ){
        return await loadFiles(factory, ["directives"]).then( deps => {
          return Promise.resolve( file == null ? deps : deps.filter(identify("basename", file)));
        });
      }
    }
    let fn = explainer[path];
    this.loaded = fn( file ).then( deps => {
      this.deps = deps;
      this.isLoaded = true;
      return Promise.resolve( deps );
    });
  }
  isModified(){
    return this.deps.isModified()
  }
}
module.exports = Module