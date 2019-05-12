class Packer {
  constructor(){}
  pack( str ){
    if( typeof str !== "string" ){
      throw new Error("invalid input!!");
    }
    let arr = str.split("/"),
      factory = arr[0],
      path = arr[1],
      file = arr[2];

  }
}
module.exports = Packer