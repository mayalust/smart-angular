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
  constructor(mode, sourcemap) {
    this.mode = mode || "development";
    this.devtool = sourcemap || "source-map";
  }
  pack(moduleList, callback) {
    const gen = runWebpackList(
        moduleList.filter(module => module.isModified())
      ),
      runWebpack = ({
        entry,
        output,
        modules,
        plugins
      }) => {
        let webpackConfig = {
          entry: entry,
          output: output,
          mode: this.mode,
          devtool: this.devtool,
          module: modules,
          plugins: plugins,
        }
        /* 
        setTimeout(() => {
          gen.next();
        }); */
        webpack(webpackConfig, e => {
          console.log(e);
          if (e != null) {
            console.log(e);
          }
          gen.next();
        });
      }
    gen.next();

    function* runWebpackList(list) {
      let item;
      while (item = list.shift()) {
        yield runWebpack(runItem(item));
      };
      callback();
    }
  }
}
module.exports = Packer;