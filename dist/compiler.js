const webpack = require("webpack"),
  fs = require("fs"),
  templateLib = require("proudsmart-template"),
  beautify = require('js-beautify').js_beautify,
  pathLib = require("path"),
  Filetree = require(pathLib.join(__dirname, "./filetree.js")),
  _contain = ["controller", "directive", "service"],
  _templates = {},
  _deps = "./deps.js",
  _workpath = "../../../",
  _mainpath = pathLib.resolve(__dirname, _workpath),
  _Webpackconfig = {
    devtool : 'inline-source-map',
    mode : "development",
    module : {
      rules : [
        {
          test: /\.controller/,
          use: {
            loader : pathLib.resolve(__dirname, "./angular-loader.js"),
            options : {
              type : "controller",
              data : _templates
            }
          }
        },
        {
          test: /\.directive/,
          use: {
            loader : pathLib.resolve(__dirname, "./angular-loader.js"),
            options : {
              type : "directive",
              data : _templates
            }
          }
        },
        {
          test: /\.template/,
          use: {
            loader : pathLib.resolve(__dirname, "./angular-loader.js"),
            options : {
              type : "template",
              data : _templates
            }
          }
        },
        {
          test: /\.service/,
          use: {
            loader : pathLib.resolve(__dirname, "./angular-loader.js"),
            options : {
              type : "service",
              data : _templates
            }
          }
        }
      ]
    }
  };
function each(arr, callback){
  if(arr){
    for(let i = 0; i < arr.length; i++){
      callback(arr[i], i);
    }
  }
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
function runJs(code){
  return eval(beautify("(function(__dirname){var module = {};" +  code + "return module.exports;})(\"" + _mainpath + "\")"))
}
function getConfig(name){
  let _config = beautify("const pathLib = require(\"path\");\n\
    module.exports = {\n\
      main : pathLib.resolve(\"./ps-" + name + "\")\n\
    }");
  return new Promise((res, rej) => {
    fs.readFile(pathLib.join(_mainpath, "ps-" + name + ".config.js"), (err, d) => {
      if(err){
        err.errno == -2 && err.code == "ENOENT"
          ? fs.writeFile(pathLib.join(_mainpath, "ps-" + name + ".config.js"), _config, (err) => {
            err ? (
              console.error("创建配置文件失败"),
                rej(err)
            ) : res(str);
          }) : null;
      } else {
        res(runJs(d.toString()));
      }
    })
  })
}
function makeTemplates(config){
  let obj = {};
  let path = config["templates"],
    t = Filetree(path)
  return new Promise((res, rej) => {
    t.on("start", (root) => {
      let paths = [];
      each(root.children, function(nd){
        nd.ext === ".template" ?
          paths.push(nd.abspath) : null;
      });
      obj["template"] = paths;
      var promises = paths.map(function(p){
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
      Promise.all(promises).then(function(d){
        res(config);
      })
    })
  })
}
function makeEntryFile(config){
  let obj = {};
  return Promise.all(_contain.map((n) => {
    let path = config[n + "s"],
      t = Filetree(path);
    return new Promise((res, rej) => {
      t.on("start", (root) => {
        let arr = [];
        each(root.children, function(nd){
          nd.ext === "." + n ?
            arr.push(nd.abspath) : null;
        });
        res(arr);
        obj[n] = arr;
      });
    });
  })).then((paths) =>{
    var str = (
      str = config.dependencies ? config.dependencies.map((n) => {
        return "require(\"" + n + "\");\n";
      }).join("") : "",
        str += "let deps = {};",
        eachProp(obj, (n, i) => {
          str += "deps[\"" + i + "\"] = [];";
          str += n.map((p) => {
            return "deps[\"" + i + "\"].push(require(\"" + p + "\"));";
          }).join("");
        }),
        str += "module.exports = deps;",
        beautify(str)
    );
    return new Promise((res, rej) => {
      fs.writeFile(pathLib.resolve(__dirname, _deps), str, (err) => {
        err
          ? console.error("无法创建打包文件")
          : res(str);
      })
    })
  });
}
function wepackRun(name){
  return new Promise((res, rej) => {
    extend(_Webpackconfig, {
      entry : {
        app : pathLib.join( __dirname, "./smart-angular.js" )
      },
      output: {
        path: pathLib.join( __dirname, _workpath , "./ps-" + name),
        filename: 'output.js'
      }
    })
    webpack(_Webpackconfig, (err) => {
      err
        ? console.error("打包失败")
        : res("success");
    })
  })
}
function initFolder(name){
  return new Promise(function(res, rej){
    let p = pathLib.join( __dirname, _workpath , "./ps-" + name);
    fs.mkdir(p, 0o777, function(err, d){
      err
        ? (err.message = err.code === "EEXIST"
        ? "[" + name + "]已经被创建，请重新选择初始化项目名"
        : null, rej(err))
        : res("创建成功");
    })
  })
}
function createContains(name){
  let proms = ["template"].concat(_contain).map(function(n){
    return new Promise(function(res, rej){
      let p = pathLib.join( __dirname, _workpath , "./ps-" + name, "./" + n + "s");
      fs.mkdir(p, 0o777, function(err, d){
        err
          ? (err.message = err.code === "EEXIST"
          ? "[" + name + "]已经被创建，请重新选择初始化项目名"
          : null, rej(err))
          : res("创建成功");
      })
    })
  });
  return Promise.all(proms);
}
function makeConfigFile(name){
  var str = "const pathLib = require(\"path\");"
  str += "module.exports = {";
  str += "name : \"" + name + "\",";
  str += "output: pathLib.resolve(__dirname, \"./ps-" + name + "/output.js\"),";
  str += ["template"].concat(_contain).map(function(n){
    return n + "s : pathLib.resolve(__dirname, \"./ps-" + name + "/"+ n +"s\"),"
  }).join("");
  str += "}";
  return new Promise(function(res, rej){
    let p = pathLib.join( __dirname, _workpath , "./ps-" + name + ".config.js");
    fs.writeFile(p, beautify(str), function(err){
      err
        ? (err.message = err.code === "EEXIST"
        ? "[" + name + "]已经被创建，请重新选择初始化项目名"
        : null, rej(err))
        : res("创建成功");
    })
  })
}
module.exports = {
  run : function(name){
    getConfig(name).then(( config ) => {
      _output = config.main || pathLib.resolve(_mainpath, "./ps-" + name + "/output.js");
      return makeTemplates(config);
    }).then(( config ) => {
      return makeEntryFile(config);
    }).then(( entryFile ) => {
      return wepackRun(name);
    })
  },
  init : function(name){
    initFolder(name).then(function(d){
        return createContains(name);
      }).then(function(d){
    }).then(function(d){
      return makeConfigFile(name);
    }).catch(function(e){
      console.error(e.message || e);
    })
  }
}