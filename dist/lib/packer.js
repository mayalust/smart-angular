const Module = require("./module"),
  webpack = require("webpack");

function runItem(obj) {
  let {
    entry,
    optimization
  } = obj;
  obj.entry = typeof entry == "function" ? entry() : entry;
  obj.optimization = typeof optimization == "function" ? optimization() : optimization;
  return obj;
}
class Packer {
  constructor(mode, sourcemap) {
    this.mode = mode || "development";
    this.devtool = sourcemap || "source-map";
  }
  pack(moduleList, callback) {
    let modifiedList = moduleList.filter(module => module.isModified()),
      unModifiedList = moduleList.filter(module => !module.isModified());
    const gen = runWebpackList(moduleList),
      runWebpack = module => {
        let next = asset => {
            setTimeout(() => {
              gen.next(asset);
            });
          },
          packup = () => {
            let {
              entry,
              optimization,
              output,
              modules,
              plugins
            } = module,
            webpackConfig = {
              entry,
              output,
              mode: this.mode,
              devtool: this.devtool,
              module: modules,
              optimization,
              plugins
            };
            webpack(webpackConfig, e => {
              module.getUpdatedAsset(asset => {
                next(asset);
              });
            });
          };
        if (module.isModified()) {
          return packup();
        }
        module.getAsset(asset => {
          if (asset.js == null && asset.css == null) {
            return packup();
          }
          return next(asset);
        });
      };
    gen.next();

    function* runWebpackList(list) {
      let item,
        assets = [];
      while ((item = list.shift())) {
        assets.push(yield runWebpack(runItem(item)));
      }
      callback(assets);
    }
  }
}
module.exports = Packer;