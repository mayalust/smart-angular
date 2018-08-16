const compiler = require("./compiler"),
  developer = require("./developer");
module.exports = function(cmd, name){
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
    default :
      break;
  }
}