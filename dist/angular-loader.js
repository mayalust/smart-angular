const js_beautify = require('js-beautify').js_beautify,
  templateLib = require("proudsmart-template"),
  pathLib = require("path"),
  less = require("less"),
  sass = require("sass"),
  babel = require("babel-core"),
  CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''),
  loaderUtils = require("loader-utils");
module.exports = function (source,map) {
  const option = loaderUtils.getOptions(this),
    templates = option.data;
  this.cacheable(true);
  let type = option.type,
    alias = switchName(pathLib.basename(this.resourcePath)),
    anychar = "(?:.|\\n|\\r)",
    blank = "\\s*",
    space = "[\s\n\r]*",
    fnStr = "",
    isScoped,
    test = "",
    uid = uuid(),
    callback = this.async(),
    exprCtrl = {
      "config" : {
        regexp : tagExpr("config"),
        handler : function(source, attr){
          source = source ? source : "";
          return "var config = "
            + (typeof attr === "object"
              ? JSON.stringify(attr)
              : attr) + ";\n";
        }
      },
      "style" : {
        regexp : tagExpr("style"),
        handler : function(source, attr){
          attr = attr || {};
          isScoped = attr.scoped === "true";
          let css;
          if(attr && attr["type"] === "less"){
            return new Promise(function(res, rej){
              renderLess(source)
                .then(function(d){
                  css = isScoped
                    ? scopedCss(replaceAllReture(d.css))
                    : replaceAllReture(d.css);
                  res("var style = \"" + css + "\";\n")
                }).catch(function(e){
                  rej(e);
              })
            });
          } else if(attr && attr["type"] === "sass"){
            return new Promise(function(res, rej){
              renderSass(source)
                .then(function(d){
                  css = isScoped
                    ? scopedCss(replaceAllReture(d.css))
                    : replaceAllReture(d.css);
                  res("var style = \"" + css + "\";\n")
                }).catch(function(e){
                rej(e);
              })
            });
          } else {
            css = isScoped
              ? scopedCss(replaceAllReture(source))
              : replaceAllReture(source);
            return "var style = \"" + css + "\";\n";
          }
        }
      },
      "template" : {
        regexp : tagExpr("template"),
        handler : function(source, attr){
          source = source ? source : "";
          return "var template = \"" + prerender(removeAllReture(source)) + "\";\n";
        }
      },
      "script" : {
        regexp : tagExpr("script"),
        handler : function(source, attr){
          let options = {
            presets : "es2015"
          };
          try {
            let codeObj = babel.transform(source, options);
            return codeObj.code;
          } catch(e){
            return "throw new Error(\'" + e.message + "\');";
          }
        }
      }
    },
    exprTemp = {
      "template" : {
        regexp : tagExpr("template"),
        handler : function(source, attr){
          return "var template = { data : \"" + pretemplate(replaceAllReture(source)) + "\"};\n\
            template[name] = " + attr[name];
        }
      }
    },
    exprAttr = new RegExp(blank + "(\\w+)" + blank + "=" + blank + "\\\"" + "([^\"]*)" + "\\\"", "g");
  function scopedCss(css){
    var styleExp = /^[\s\r\n]*([^{]*\{[^}]*\})[\r\s\n]*/g,
    rs = "", match;
    while( styleExp.lastIndex = 0, match = styleExp.exec(css) ){
      rs += "[scoped-" + uid + "] " + match[1] + "\\n";
      css = css.substring(match[0].length);
    }
    return rs;
  }
  function renderLess(input){
    return less.render(input, {sourceMap: {sourceMapFileInline: true}});
  }
  function renderSass(input){
    return new Promise((res, rej) => {
      sass.render({data : input}, (err, result) => {
        err
          ? rej(err)
          : res(result);
      })
    });
  }
  function uuid(len, radix) {
    let chars = CHARS, uuid = [], i;
    radix = radix || chars.length;
    if(len) {
      for(i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
    } else {
      let r;
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';
      for(i = 0; i < 36; i++) {
        if(!uuid[i]) {
          r = 0 | Math.random() * 16;
          uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
        }
      }
    }
    return uuid.join('');
  };
  function recursive(json, callback, parent){
    if(json instanceof Array){
      for(var i = 0; i < json.length; i++){
        recursive(json[i], callback, {
          children : json
        });
      }
    } else {
      callback && callback(json, parent || null);
      if(json.children){
        for(var i = 0; i < json.children.length; i++){
          recursive(json.children[i], callback, json);
        }
      }
    }
  }
  function prerender(str){
    var json = templateLib.html2json(str),s, cls;
    if(json.children > 1){
      console.error("错误：模版节点，产生了多于1个根节点。");
      return null;
    }
    recursive(json, function(node, parent){
      var children, inx,
        template = templates[node.localName];
      if(template){
        children = node.children;
        inx = parent.children.indexOf(node);
        [].splice.apply(parent.children, [inx, template.length].concat(template));
        recursive(template, function(n, parent){
          if(n.localName === "slot"){
            inx = parent.children.indexOf(n);
            [].splice.apply(parent.children, [inx, children.length].concat(children));
          }
        })
      }
    });
    if(json.children && json.children.length > 0){
      if(!json.children[0]){
        console.error("json.children[0] is undefined");
        console.dir(json);
      }
      json.children[0].params = json.children[0].params || {};
      if(isScoped){
        json.children[0].params["scoped-" + uid] = null;
      }
    }
    s = templateLib.json2html(json, true);
    return replaceAllReture(s);
  }
  function switchName(filename){
    function changeName(str){
      var rs = "", c;
      for(var i = 0; i < str.length; i++){
        rs += (c = str.charAt(i),
          c === "-"
            ? (i++, str.charAt(i).toUpperCase())
            : c);
      }
      return rs;
    }
    return (
      filename = filename.indexOf(".") !== -1
        ? filename.split(".")[0]
        : filename,
        changeName(filename)
    )
  }
  function removeBlankEveryLine(str){
    return str.split(/\n/g)
      .map(function(n){
        return n.substring(2);
      })
      .join("\n");
  }
  function handleTemplate(str){
    proudsmart-base
  }
  function removeAllReture(str){
    let rs = "";
    for(var i = 0; i < str.length; i++){
      if(str[i] === "\n") {
        rs += "";
      } else {
        rs += str[i];
      };
    };
    return rs;
  }
  function replaceAllReture(str){
    let rs = "";
    str = str || "";
    for(var i = 0; i < str.length; i++){
      if(str[i] === "\n") {
        rs += "\\\n";
      } else if(str[i] === "\""){
        rs += "\\\""
      } else {
        rs += str[i];
      };
    };
    return rs;
  }
  function detaiAttr(str){
    let rs = str.indexOf(",") != -1
      ? (str = /^\s*(.*[^\s])\s*$/g.exec(str),
        str = str ? str[1] : null,
        str = str ? str.split(new RegExp(blank + "," + blank)) : null)
      : str
    return rs
  }
  function getAttr(str){
    let match, obj = {};
    if(typeof str !== "string") return null;
    while( match = exprAttr.exec( str ) ){
      obj[match[1]] = detaiAttr( match[2] );
    }
    return obj;
  }
  function tagExpr(tag){
    return new RegExp("\\<" + blank + tag + blank + "([^><]*)(?:\/\\>|\\>(" + anychar + "*)\\<" + blank + "\/" + blank + tag + blank + "\\>)");
  }
  function mapObj(obj, callback){
    var rs = [];
    for(var i in obj){
      rs.push(callback(obj[i], i));
    }
    return rs;
  }
  renderString = {
    "template" : function(){
      return new Promise(function(res, rej){
        promises = mapObj(exprTemp, ( exp ) => {
          return new Promise(function(res, rej){
            let match = exp["regexp"].exec(source),
              val = exp["handler"](match[2], getAttr(match[1] || null));
            if(val instanceof Promise){
              val.then((d) => {
                res(d);
              }).catch((e) => {
                rej(e);
              })
            } else {
              res(val);
            }
          })
        });
        Promise.all(promises).then((arr) => {
          let fnStr = "";
          fnStr += arr.join("");
          res(fnStr);
        }).catch((e) => {
          rej(e);
        });
      })
    },
    "controller" : function(){
      return new Promise(( res, rej ) => {
        promises = mapObj(exprCtrl, ( exp ) => {
          return new Promise(( res, rej ) => {
            let match = exp["regexp"].exec(source),
              val = exp["handler"](match[2], getAttr(match[1] || null));
            if(val instanceof Promise){
              val.then((d) => {
                res(d);
              }).catch((e) => {
                rej(e)
              })
            } else {
              res(val);
            }
          })
        });
        Promise.all(promises).then((arr) => {
          let fnStr = "";
          fnStr += arr.join("")
          fnStr += `\nmodule.exports = {
            name : \"${alias}\",
            config : config,
            template : template,
            style : style,
            ${type} : exports.default || module.exports
          }`;
          res(fnStr);
        }).catch((e) => {
          console.error(e);
          rej(e);
        });
      });
    },
    "service" : function(){
      return new Promise(( res, rej ) => {
        promises = mapObj(exprCtrl, ( exp ) => {
          return new Promise(( res, rej ) => {
            let match = exp["regexp"].exec(source),
              val = exp["handler"](match ? match[2] : null, match ? getAttr(match[1] || null) : null);
            if(val instanceof Promise){
              val.then((d) => {
                res(d);
              }).catch((e) => {
                rej(e)
              })
            } else {
              res(val);
            }
          })
        });
        Promise.all(promises).then((arr) => {
          let fnStr = "";
          fnStr += arr.join("");
          fnStr += `\nmodule.exports = {
            name : \"${alias}\",
            config : config,
            ${type} : exports.default || module.exports
          }`;
          res(fnStr);
        }).catch((e) => {
          console.error(e);
          rej(e);
        });
      });
    },
    "directive" : function(){
      return new Promise(( res, rej ) => {
        promises = mapObj(exprCtrl, ( exp ) => {
          return new Promise(( res, rej ) => {
            let match = exp["regexp"].exec(source),
              val = exp["handler"](match[2], getAttr(match[1] || null));
            if(val instanceof Promise){
              val.then((d) => {
                res(d);
              }).catch((e) => {
                rej(e)
              })
            } else {
              res(val);
            }
          })
        });
        Promise.all(promises).then((arr) => {
          let fnStr = "";
          fnStr += arr.join("");
          fnStr += `\nmodule.exports = {
            name : \"${alias}\",
            config : config,
            template : template,
            style : style,
            ${type} : exports.default || module.exports
          }`;
          res(fnStr);
        }).catch((e) => {
          console.error(e);
          rej(e);
        });
      });
    },
    "filter" : function(){
      return new Promise(( res, rej ) => {
        promises = mapObj(exprCtrl, ( exp ) => {
          return new Promise(( res, rej ) => {
            let match = exp["regexp"].exec(source),
              val = exp["handler"](match ? match[2] : null, match ? getAttr(match[1] || null) : null);
            if(val instanceof Promise){
              val.then((d) => {
                res(d);
              }).catch((e) => {
                rej(e)
              })
            } else {
              res(val);
            }
          })
        });
        Promise.all(promises).then((arr) => {
          let fnStr = "";
          fnStr += arr.join("");
          fnStr += `\nmodule.exports = {
            name : \"${alias}\",
            config : config,
            ${type} : exports.default || module.exports
          }`;
          res(fnStr);
        }).catch((e) => {
          console.error(e);
          rej(e);
        });
      });
    },
    "style" : function(){
      return new Promise(( res, rej ) => {
        let fnStr = "", val, handler = exprCtrl["style"]["handler"];
        fnStr += handler(source);
        fnStr += `\nmodule.exports = {
          style : style
        }`
        res(fnStr);
      });
    },
    "less" : function(){
      return new Promise(( res, rej ) => {
        let fnStr = "", val,
          handler = exprCtrl["style"]["handler"],
          promise = handler(source, {type : "less"});
        promise.then(function(str){
          console.log(str);
          fnStr += str;
          fnStr += `\nmodule.exports = {
            style : style
          }`;
          res(fnStr);
        })
      });
    },
    "sass" : function(){
      return new Promise(( res, rej ) => {
        let fnStr = "", val,
          handler = exprCtrl["style"]["handler"],
          promise = handler(source, {type : "sass"});
        promise.then(function(str){
          fnStr += str;
          fnStr += `\nmodule.exports = {
            style : style
          }`;
          res(fnStr);
        })
      });
    }
  }
  renderString[type]().then( (d) => {
      callback(null, js_beautify(d), map);
    }).catch((e) => {
    console.error(e);
  });
  return;
}