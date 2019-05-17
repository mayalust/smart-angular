const Module = require("./module"),
  webpack = require("webpack");
class Packer {
  constructor() {}
  pack(moduleList, callback) {
    let gen = runWebpackList(moduleList.filter(module => module.isModified()));
    gen.next();

    function* runWebpackList(list) {
      let item = list.shift();
      while (item = list.shift()) {
        yield runWebpack(item)
      }
      callback();
    }

    function runWebpack({
      entry,
      output
    }) {
      let webpackConfig = {
        entry: entry,
        output: output
      }
      webpack(webpackConfig).then(d => {
        gen.next();
      })
    }
  }
}
module.exports = Packer