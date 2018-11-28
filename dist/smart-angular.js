(function(global, factory){
  if(typeof window === "undefined"){
    module.exports = loadModule;
  } else {
    if(typeof window.define === "function"){
      window.define(factory);
    } else {
      window.smartAngular = factory();
    }
  }
})(this, function(){
  const deps = require("./deps.js"),
    isArray = isType("Array"),
    slice = Array.prototype.slice,
    tostring = Object.prototype.toString,
    isUndefined = isType("Undefined"),
    pHandler = propertiesHandler(),
    _tools = [
      'controllers',
      'directives'
    ];
  let comptree = deps['comptree'];
  function isType(type){
    return function(obj){
      return tostring.call(obj) === "[object " + type + "]";
    }
  }
  function bind(target, fn){
    return function(){
      fn.apply(target, arguments);
    }
  }
  function each(arr, callback){
    var i;
    if(arr){
      for(i = 0; i < arr.length; i++){
        callback(arr[i], i, arr);
      }
    }
  }
  function eachProp(obj, callback){
    var i;
    for( i in obj ){
      callback && callback( obj[i], i )
    }
  }
  function extend(a, b){
    for(var i in b){
      a[i] = b[i];
    }
    return a;
  }
  function clone(obj){
    return JSON.parse(JSON.stringify(obj));
  }
  function str2Array(obj){
    return isArray(obj) ? obj : ( obj ? [obj] : null);
  }
  function switch2Str(obj){
    if(typeof obj === " function"){
      return obj.toString();
    } else if(typeof obj === "object"){
      return JSON.stringify(obj);
    } else if(typeof obj === "number" && obj === obj){
      return obj += "";
    } else if(typeof obj === "string"){
      return obj;
    }
  }
  function propertiesHandler(){
    window[`__freeboardProperties__`] = window[`__freeboardProperties__`] || {};
    function add(name, value){
      if(!window[`__freeboardProperties__`][name] ){
        window[`__freeboardProperties__`][name] = value;
        if(value.then){
          value.then(function(d){
            window[`__freeboardProperties__`] = d;
          })
        }
      }
    }
    function get(name, callback){
      var props = window[`__freeboardProperties__`];
      if(props[name]){
        if(props[name].then){
          props[name].then(function(n){
            callback && callback(clone(n));
          })
        } else {
          callback && callback(props[name]);
        }
      } else {
        callback && callback(null)
      }
    }
    function getAllAttrs(name, callback){
      var obj = {};
      get(name, function(p){
        each(p, function(n){
          eachProp(n.attributes, function(m, i){
            obj[i] = m['value'] || m[2];
          })
        });
        callback && callback(obj);
      });
    }
    function getAttr(name, attr, callback){
      get(name, function(props){
        for(var i = 0; i < props.length; i++){
          var p = props[i];
          for(var j in p.attributes){
            if(p.attributes[attr]){
              callback && callback(p.attributes[attr]);
              return
            }
          }
        };
        callback && callback(null);
      });
    }
    function getAll(){
      return window[`__freeboardProperties__`]
    }
    return {
      add : add,
      get : get,
      getAll : getAll,
      getAttr : getAttr,
      getAllAttrs : getAllAttrs
    }
  }
  function remapFunction(name, method, fn, temp, props, comptree){
    var m = null;
    switch(method){
      case "directive":
        return function(){
          var args = [].slice.call(arguments), obj,
            args = args.concat([pHandler, comptree]);
          if(!pHandler.get(name) && props){
            pHandler.add(name, props.apply(null, arguments))
          }
          obj = fn.apply(null, args);
          extend(obj, {
            template : temp || obj.template,
            restrict :  obj.restrict || "E",
            replace : typeof obj.replace == "undefined" ? true : obj.replace
          });
          return obj;
        }
        break;
      default :
        return function(){
          var args = [].slice.call(arguments);
          args.push(comptree);
          return fn.apply(this, args);
        }
        break;
    }
  }
  function inject(module, method, list){
    each(list, function(item){
      if(!item.config){
        return;
      }
      var name = item.config.name || item.name,
        md = method === "component" ? "directive" : method,
        config = item.config,
        type = config.type,
        props = item.properties,
        mtd = md === "service"
          ? ( type || "factory")
          : md,
        fn = remapFunction(name, md, item[method], item.template, props, comptree),
        p = str2Array(config.injector),
        params = p ? p.concat([fn]) : fn;
      //props ? pHandler.add(name, props()) : null;
      //console.log(mtd, name, params);
      name
        ? module[mtd](name, params)
        : console.warn("没有提供名称的组件不能被注册。")
    });
  }
  function loader(dependencies){
    var definition = {
      resolver: ['$q', '$rootScope', function($q, $rootScope) {
        var defered = $q.defer();
        require(dependencies, function() {
          $rootScope.$apply(function() {
            defered.resolve();
          });
        });
        return defered.promise;
      }]
    };
    return definition;
  }
  function getResource(path, e){
    return "../../solution/" + path + "/" + e;
  }
  function getDataFromArgs(args){
    var arr = slice.call(args, 0);
    return arr.reduce(function(a, b){
      return a.concat(b);
    }, []);
  }
  function addCss(res){
    return res.map(function(n){
      return n.style
    }).join("");
  }
  function renderCss(css){
    var cssNode = document.createElement("style");
    var header = document.getElementsByTagName("head")[0];
    cssNode.type = "text/css";
    cssNode.rel = "stylesheet";
    cssNode.innerHTML = css;
    header.appendChild(cssNode);
    header.onload = function(e){
      console.log(e);
    }
  }
  module = angular.module("ps_" + deps.name, ['ngRoute']), combinedCss = "";
  eachProp(deps["tools"], function(res, type){
    inject(module, type, res);
    combinedCss += addCss(res);
  });
  renderCss(combinedCss);
  module.config([
    '$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {
      var controllers = deps["tools"]["controller"], defaultRouter;
      eachProp(controllers, function(ctrl, i){
        var router = ctrl.config.router || ctrl.name,
          params = ctrl.config.params || "";
        defaultRouter = defaultRouter || (ctrl.config.defaultRouter ? router : null)
        $routeProvider.when("/" + router + params, {
          template : ctrl.template,
          controller: ctrl.config.name || ctrl.name
        })
      });
      $locationProvider.hashPrefix('');
      $routeProvider.otherwise({redirectTo:'/' + ( defaultRouter ? defaultRouter : "")});
    }
  ]);
  return module;
})