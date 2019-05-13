let Module = require("./module");
class Packer {
  constructor(){}
  pack( str ){
    if( typeof str !== "string" ){
      throw new Error("invalid input!!");
    }
    let arr = str.split("/"),
      factory = arr[0],
      path = arr[1],
      file = arr[2],
      module = new Module(factory, path, file);
    module.then(()=>{
      console.log("module loaded!!");
    })  
  }
}
module.exports = Packer