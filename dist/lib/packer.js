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
    this.generator = null;
  }
  pack(moduleList, callback) {
    let runWebpack, moduleListQueue = moduleList.filter(module => module.isModified()),
      _self = this;
    if (this.generator == null) {
      console.info(`[开始(队列)] 渲染队列开始启动， 队列总任务数为${moduleList.length}个`);
      this.time = new Date;
      this.packupQueue = moduleListQueue;
      this.index = 1;
      this.generator = runWebpackList(moduleList),
        runWebpack = module => {
          let next = asset => {
              setTimeout(() => this.generator.next(asset));
            },
            time = new Date(),
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
              console.info(`-- 任务${this.index} :{`)
              console.info(`---- 开始打包文件:[${module.getId()}]`);
              webpack(webpackConfig, e => {
                module.getUpdatedAsset(asset => {
                  console.info(`---- 结束打包文件:[${module.getId()}], 总共用时 : [${ ( new Date - time ) / 1000 }秒]`)
                  console.info(`-- }`)
                  this.index++
                  next(asset);
                });
              });
            };
          if (module.isModified()) {
            return packup();
          }
          console.info(`-- 取缓存*** ：{`);
          console.info(`---- 这个模块有缓存，从资源模块中提取数据;`);
          module.getAsset(asset => {
            console.info(`---- 结束取缓存`);
            console.info(`-- }`);
            if (asset && asset.js == null && asset.css == null) {
              return packup();
            }
            return next(asset);
          });
        };
      this.generator.next();
    } else {
      [].push.apply(this.packupQueue, moduleListQueue);
      console.info(`[插入] 有新任务插入， 队列总任务数为${this.packupQueue.length}个`);
    }

    function* runWebpackList(list) {
      let item,
        assets = [];
      while ((item = list.shift())) {
        assets.push(yield runWebpack(runItem(item)));
      }
      console.info(`[完成(队列)] 全部任务完成, 总耗时: [${ ( new Date - _self.time ) / 1000 }秒]`);
      callback(assets);
    }
  }
}
module.exports = Packer;