const { extend, getFilePath, isArray, isFunction, tree, random, eachProp, dateparser } = require("ps-ultility"),
  Server = require("./lib/server.js"),
  Command = require("./lib/Command.js"),
  workpath = process.cwd(),
  filepath = getFilePath(__filename);
class smartAngular{
  constructor(){
    let config = {
      "workpath" : workpath,
      "filepath" : filepath
    }
    this.server = new Server( config );
    this.command = new Command( config );
  }
  pack( str ){
    this.command.pack( str );
  }
  start( app, factory ){
    this.server.start( factory );
  }
}
module.exports = new smartAngular;



module.exports = function(){
  let loader = new MainLoader(factory, path, file);
  let deps = Mainloader.getDeps()

}