const webpack = require("webpack"),
  fs = require("fs"),
  templateLib = require("proudsmart-template"),
  beautify = require('js-beautify').js_beautify,
  pathLib = require("path"),
  Filetree = require(pathLib.join(__dirname, "./filetree.js")),
  _contain = ["controller", "directive", "service", "filter", "style"],
  _templates = {},
  _deps = "./deps.js",
  _workpath = pathLib.resolve(process.cwd()),
  _Webpackconfig = {
    devtool : 'inline-source-map',
    mode : "development",
    module : {
      rules : [
        {
          test: /\.controller$/,
          use: {
            loader : pathLib.resolve(__dirname, "./angular-loader.js"),
            options : {
              type : "controller",
              data : _templates
            }
          }
        },
        {
          test: /\.directive$/,
          use: {
            loader : pathLib.resolve(__dirname, "./angular-loader.js"),
            options : {
              type : "directive",
              data : _templates
            }
          }
        },
        {
          test: /\.template$/,
          use: {
            loader : pathLib.resolve(__dirname, "./angular-loader.js"),
            options : {
              type : "template",
              data : _templates
            }
          }
        },
        {
          test: /\.service$/,
          use: {
            loader : pathLib.resolve(__dirname, "./angular-loader.js"),
            options : {
              type : "service",
              data : _templates
            }
          }
        },
        {
          test: /\.filter$/,
          use: {
            loader : pathLib.resolve(__dirname, "./angular-loader.js"),
            options : {
              type : "filter",
              data : _templates
            }
          }
        },
        {
          test: /\.less$/,
          use: [{
            loader : pathLib.resolve(__dirname, "./angular-loader.js"),
            options : {
              type : "less",
              data : _templates
            }
          }]
        },
        {
          test: /\.sass$/,
          use: [{
            loader : pathLib.resolve(__dirname, "./angular-loader.js"),
            options : {
              type : "sass",
              data : _templates
            }
          }]
        },
        {
          test: /\.css$/,
          use: [{
            loader : pathLib.resolve(__dirname, "./angular-loader.js"),
            options : {
              type : "style",
              data : _templates
            }
          }]
        }
      ]
    }
  };
function info(){
  console.info.apply(console, arguments);
}
function log(){
  console.log.apply(console, arguments);
}
function error(){
  console.error.apply(console, arguments);
}
function each(arr, callback){
  if(arr){
    for(let i = 0; i < arr.length; i++){
      callback(arr[i], i);
    }
  }
}
function some(arr, callback){
  if(arr){
    for(let i = 0; i < arr.length; i++){
      if(callback(arr[i], i)){
        return true;
      };
    }
  }
  return false
}
function eachProp(obj, callback){
  for(var i in obj){
    callback(obj[i], i);
  }
}
function propMap(obj, callback){
  var rs = {}
  for(var i in obj){
    rs[i] = callback(obj[i], i);
  }
  return rs;
}
function extend(a, b){
  for(var i in b){
    a[i] = b[i];
  }
  return a;
}
function check(str, exclude){
  let rs;
  if(exclude instanceof RegExp){
    rs = exclude ? !exclude.test(str) : true
  } else if( exclude instanceof Array ){
    rs = !some(exclude, function(exd){
      return exd ? exd.test(str) : true;
    })
  } else {
    rs = false;
  }
  if(!rs){
    info(str, "文件不被倒入");
  }
  return rs;
}
function makeDefaultConf(name){
  let paths = ["template"].concat(_contain),
    end = paths.pop()
  return beautify(["const pathLib = require(\"path\");",
    "let filepath = pathLib.resolve(__filename, \"..\/\");",
    "module.exports = {",
    "name : \"" + name + "\",",
    "output: pathLib.resolve(__filename, \"./ps-" + name + "/output.js\"),"
  ].concat(paths.map((n, i) => {
    return n + "s : { path : pathLib.resolve(filepath, \"./ps-" + name + "/"+ n +"s\"), exclude : [\/\\.test\/g, /[\\\\\\/]exclude[\\\\\\/]/g] },"
  })).concat([end].map((n, i) => {
    return n + "s : { path : pathLib.resolve(filepath, \"./ps-" + name + "/"+ n +"s\"), exclude : [\/\\.test\/g, /[\\\\\\/]exclude[\\\\\\/]/g] }"
  })).concat(["}"]).join(""));
}
function getConfig(name){
  var str = makeDefaultConf(name);
  return new Promise((res, rej) => {
    let configpath = pathLib.join(_workpath, "ps-" + name + ".config.js");
    fs.readFile(configpath, (err, d) => {
      if(err){
        err.code == "ENOENT"
          ? fs.writeFile(pathLib.join(_workpath, "ps-" + name + ".config.js"), str, (err) => {
            err ? (
              console.error("创建配置文件失败"),
                rej(err)
            ) : (
              info("创建配置文件完成！"),
                res(require(configpath))
            )
          }) : null;
      } else {
        res(require(configpath));
      }
    })
  })
}
function makeTemplates(config){
  let obj = {};
  let pa = config["templates"],
    path = typeof pa === "object" ? pa.path : pa,
    exclude = typeof pa === "object" ? pa.exclude : null,
    t = Filetree(path);
  return new Promise((res, rej) => {
    t.on("start", (root) => {
      let paths = [];
      each(root.children, (nd) => {
        nd.ext === ".template" ?
          paths.push(nd.abspath) : null;
      });
      obj["template"] = paths;
      var promises = paths.filter((p) =>{
        return check(p, exclude);
      }).map((p) =>{
        return new Promise((res, rej) => {
          fs.readFile(p, (err, d) => {
            let template = err ? console.error(err.message)
              : d.toString(), basename = pathLib.basename(p),
              match = /([\w\$\@-]+)(?:\.[\w\$\@-]+)/g.exec(basename), temp;
            basename = match ? match[1] : "";
            temp = templateLib.html2json(template);
            temp = temp.children[0].children;
            _templates[basename] = temp;
            res();
          });
        });
      });
      Promise.all(promises).then((d) => {
        res(config);
      }).catch((e) => {
        rej(e);
      })
    })
  })
}
function makeEntryFile(config, name){
  let obj = {};
  return Promise.all(_contain.map((n) => {
    let pa = config[n + "s"],
      exclude = typeof pa === "object" ? pa.exclude : null,
      path = typeof pa === "object" ? pa.path : pa,
      t = Filetree(path);
    return new Promise((res, rej) => {
      t.on("start", (root) => {
        let arr = [];
        function recursive(node, callback){
          callback && callback(node);
          each(node.children, (nd) => {
            recursive(nd, callback);
          });
        }
        recursive(root, (nd) => {
          ( nd.ext === ".css" || nd.ext === ".less" || nd.ext === "." + n ) && check(nd.abspath, exclude)?
            arr.push(nd.abspath) : null;
        });
        res(arr);
        obj[n] = arr;
      });
      t.on("error", (e) => {
        res(null)
      })
    });
  })).then((paths) =>{
    var str = (
      str = config.dependencies ? config.dependencies.map((n) => {
        return "require(\"" + n + "\");\n";
      }).join("") : "",
        str += "var deps = {};",
        str += "deps[\"name\"] = \"" + name + "\"",
        str += "deps[\"tools\"] = {}",
        eachProp(obj, (n, i) => {
          str += "deps[\"tools\"][\"" + i + "\"] = [];";
          str += n.map((p) => {
            return "deps[\"tools\"][\"" + i + "\"].push(require(\"" + normalize(p) + "\"));";
          }).join("");
        }),
        str += "module.exports = deps;",
        beautify(str)
    );
    return new Promise((res, rej) => {
      fs.writeFile(pathLib.resolve(__dirname, _deps), str, (err) => {
        err
          ? (console.error("无法创建打包文件"),rej(err))
          : res(str);
      })
    })
  });
}
function normalize(path){
  var rs = "";
  each(path, function(n){
    rs += n === "\\" ? "\/" : n
  })
  return rs;
}
function wepackRun(name){
  return new Promise((res, rej) => {
    extend(_Webpackconfig, {
      entry : {
        app : pathLib.join( __dirname, "./smart-angular.js" )
      },
      output: {
        path: pathLib.join( _workpath , "./ps-" + name),
        filename: 'output.js'
      }
    })
    webpack(_Webpackconfig, (err) => {
      err
        ? (console.error("打包失败"),rej(err))
        : res("success");
    })
  })
}
function initFolder(name){
  return new Promise((res, rej) => {
    let p = pathLib.join( _workpath , "./ps-" + name);
    fs.mkdir(p, 0o777, (err, d) => {
      err
        ? (err.message = err.code === "EEXIST"
        ? "[" + name + "]已经被创建，请重新选择初始化项目名"
        : null, rej(err))
        : (res("创建成功"));
    })
  })
}
function createContains(name){
  let proms = ["template"].concat(_contain).map((n) => {
    return new Promise((res, rej) => {
      let p = pathLib.join( _workpath , "./ps-" + name, "./" + n + "s");
      fs.mkdir(p, 0o777, (err, d) => {
        err
          ? (err.message = err.code === "EEXIST"
          ? "[" + name + "]已经被创建，请重新选择初始化项目名"
          : null, rej(err))
          : (res("创建成功"));
      })
    })
  });
  return Promise.all(proms);
}
function createContainedFiles(name){
  info("开始复制模版")
  let tempFiles = pathLib.join(__dirname, "./template"),
    t = Filetree(tempFiles);
  function recursive(node, callback){
    callback && callback(node);
    for(var i in node.children){
      recursive(node.children[i], callback)
    }
  }
  return new Promise((res, rej) => {
    t.on("start", (root) => {
      let paths = []
      recursive(root, (node) => {
        if(node !== root && node.basename != ".DS_Store"){
          if(node.ext !== ""){
            paths.push(new Promise((res, rej) => {
              let repath = node.abspath.split(root.abspath)[1];
              repath = pathLib.join(_workpath, "./ps-" + name, repath);
              fs.readFile(node.abspath, (err, d) => {
                if(err){
                  rej(err);
                } else {
                  fs.writeFile(repath, d, (err) => {
                    err
                      ? rej(err) : res("创建文件成功");
                  })
                }
              })
            }));
          }
        }
      });
      Promise.all(paths).then(function(d){
        res(d)
      }).catch(function(e){
        rej(e);
      });
    });
  })
}
function makeConfigFile(name){
  var str = makeDefaultConf(name);
  return new Promise((res, rej) => {
    let p = pathLib.join( _workpath , "./ps-" + name + ".config.js");
    fs.writeFile(p, beautify(str), (err) => {
      err
        ? (err.message = err.code === "EEXIST"
        ? "[" + name + "]已经被创建，请重新选择初始化项目名"
        : null, rej(err))
        : res("创建成功");
    })
  })
}
module.exports = {
  pack : function(name){
    return new Promise(function(res, rej){
      getConfig(name).then(( config ) => {
        info("1,配置文件获取完成")
        return makeTemplates(config);
      }).then(( config ) => {
        info("2,压缩模版文件成功")
        return makeEntryFile(config, name);
      }).then(( entryFile ) => {
        info("3,压缩控制器服务文件成功")
        return wepackRun(name);
      }).then(function(d){
        info("4,Wepack打包完成");
        res("Wepack打包完成");
      }).catch(function(e){
        error(e);
        rej(e);
      })
    })

  },
  init : function(name){
    return new Promise(function(res, rej){
      initFolder(name).then(function(d){
        info("1，创建项目文件夹完成")
        return createContains(name);
      }).then(function(d){
        info("2，复制模版文件夹完成")
        return createContainedFiles(name);
      }).then(function(d){
        info("3，复制模版文件完成")
        return makeConfigFile(name);
      }).then(function(d){
        info("4，初始化过程完成！");
        res("初始化完成")
      }).catch(function(e){
        error(e);
        rej(e);
      })
    })
  }
}