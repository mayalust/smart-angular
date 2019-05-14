let Module = require("./module"),
  webpack = require("webpack");
class Packer {
  constructor(){}
  pack( modulelist, callback ){
    let gen = runWebpackList(modulelist.filter( module => module.isModified()));
    function* runWebpackList( list ){
      let item = list.shift();
      while(item = list.shift()){
        yield runWebpack( item )
      }
      callback();
    }
    function runWebpack({entry, output}){
      let webpackConfig = {
        entry : entry,
        output : output
      }
      webpack(webpackConfig).then( d => {
        gen.next();
      })
    }
  }
}
module.exports = Packer