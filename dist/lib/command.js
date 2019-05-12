const getDepsStateInstance = require("./filestate.js"),
  packer = require("./packer.js"),
  Module = require("./module.js");
class Command {
  constructor( config ){
    this.filestate = new getDepsStateInstance( config )();
  }
  pack( str ) {
    if (typeof str !== "string") {
      throw new Error("invalid input!!");
    }
    let arr = str.split("/"),
      factory = arr[0],
      path = arr[1],
      file = arr[2];
  }
}
module.exports = Command