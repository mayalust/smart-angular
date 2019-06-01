const Module = require("./module"),
  webpack = require("webpack");

function runItem(obj) {
  let {
    entry
  } = obj;
  obj.entry = typeof entry == "function" ? entry() : entry;
  return obj;
}
class Packer {
  constructor() {}
  pack(moduleList, callback) {
    const gen = runWebpackList(
      moduleList.filter(module => module.isModified())
    );
    let rs = [];
    gen.next();

    function* runWebpackList(list) {
      let item;
      while (item = list.shift()) {
        yield runWebpack(runItem(item));
      };
      callback(rs);
    }

    function runWebpack({
      entry,
      output
    }) {
      let webpackConfig = {
        entry: entry,
        output: output
      };
      rs.push(webpackConfig);
      setTimeout(() => {
        gen.next();
      });
      /* 
            webpack(webpackConfig).then(d => {
              gen.next();
            }) */
    }
  }
}
module.exports = Packer;