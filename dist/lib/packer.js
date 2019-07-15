const Module = require("./module"),
  webpack = require("webpack");

function runItem(obj) {
  let {
    entry,
    optimization
  } = obj;
  obj.entry = typeof entry == "function" ? entry() : entry;
  obj.optimization =
    typeof optimization == "function" ? optimization() : optimization;
  return obj;
}
class PackQueue {
  constructor(queue, callback) {
    this.mode = "development";
    this.devtool = "source-map";
    this.queue = queue;
    this.index = 1;
    this.callback = callback;
  }
  renderQueue(callback) {
    console.info(
      `---- [开始渲染] 渲染队列开始启动， 队列总任务数为${this.queue.length}个`
    );
    let _self = this,
      runWebpack;
    this.time = new Date();
    this.callbacks = [];
    (this.generator = runWebpackList(this.queue)),
    (runWebpack = module => {
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
          if (entry == null) {
            console.info(`---- 空任务 ( ${this.index} ) :{`);
            this.index++;
            next();
            console.info(`---- }`);
          }
          console.info(`---- 子任务 ( ${this.index} ) :{`);
          console.info(`------ 开始打包文件:[${module.getId()}]`);
          webpack(webpackConfig, e => {
            if (e == null) {
              module.getUpdatedAsset(asset => {
                console.info(
                  `------ 结束打包文件:[${module.getId()}], 总共用时 : [${(new Date() -
                      time) /
                      1000}秒]`
                );
                console.info(`---- }`);
                this.index++;
                next(asset);
              });
            } else {
              console.info(
                `------ 发生错误，结束打包文件:[${module.getId()}], 总共用时 : [${(new Date() -
                    time) /
                    1000}秒]`
              );
              next();
            }
          });
        };
      if (module.isModified()) {
        return packup();
      }
      console.info(`---- 子任务 ( ${this.index} )（取缓存）*** ：{`);
      console.info(`------ 这个模块有缓存，从资源模块中提取数据;`);
      this.index++;
      module.getAsset(asset => {
        console.info(`------ 结束取缓存`);
        console.info(`---- }`);
        if (asset && asset.js == null && asset.css == null) {
          return packup();
        }
        return next(asset);
      });
    });
    this.generator.next();

    function* runWebpackList(list) {
      let item,
        assets = [];
      while ((item = list.shift())) {
        assets.push(yield runWebpack(runItem(item)));
      }
      console.info(
        `---- [完成(队列)] 全部任务完成, 总耗时: [${(new Date() - _self.time) /
          1000}秒]`
      );
      _self.callback(assets);
      callback(assets);
    }
  }
}
class Packer {
  constructor(mode, sourcemap) {
    this.generator = null;
    this.packupQueue = null;
  }
  clear() {
    this.packupQueue = null;
  }
  pack(moduleList, callback) {
    let recursive = () => {
      let item = this.packupQueue.shift();
      if (item == null) {
        console.info(`-- 所有主任务执行完毕`);
        this.clear();
      } else {
        console.info(`-- 主任务 ( ${this.index} ) :{`);
        item.renderQueue(() => {
          this.index++;
          console.info(`-- }`);
          recursive();
        });
      }
    };
    if (this.packupQueue == null) {
      this.index = 1;
      this.packupQueue = [new PackQueue(moduleList, callback)];
      recursive();
    } else {
      this.packupQueue.push(new PackQueue(moduleList, callback));
      console.info(
        `-- [插入] 有新任务插入,队列总任务数为${this.packupQueue.length}个`
      );
    }
  }
}
module.exports = Packer;