const compiler = require("./compiler"),
  developer = require("./developer");
let obj = {};
function run(cmd, name){
  switch(cmd){
    case "pack":
      compiler.pack(name);
      break;
    case "init":
      compiler.init(name);
      break
    case "dev":
      developer.run(name);
      break;
    case "webpackdev" :
      return function(app){
        developer.run(name, app);
      };
      break;
    default :
      break;
  }
}
function use(callback){
  callback;
}
module.exports = {
  run : run,
  use : developer.use
}