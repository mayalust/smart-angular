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
    tostring = Object.prototype.toString;
  let contexts = {},
    isUndefined = isType("Undefined"),
    _tools = [
      'controllers',
      'directives'
    ];
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
    for(i = 0; i < arr.length; i++){
      callback(arr[i], i, arr);
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
  function str2Array(obj){
    return isArray(obj) ? obj : [obj];
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
  function remapFunction(method, fn, temp){
    var m = null;
    switch(method){
      case "directive":
        return function(){
          var obj = fn.apply(null, arguments);
          extend(obj, {
            template : temp || obj.template,
            restrict :  obj.restrict || "E",
            replace : typeof obj.replace == "undefined" ? true : obj.replace
          });
          return obj;
        }
        break;
      default :
        return fn;
        break;
    }
  }
  function inject(module, method, list){
    each(list, function(item){
      var name = item.config.name || item.name,
        fn = remapFunction(method, item[method], item.template),
        config = item.config,
        type = config.type,
        p = str2Array(config.injector),
        params = p ? p.concat([fn]) : fn;
      method = method === "service"
        ? ( type || "factory")
        : method;
      console.log(method, name, params);
      name
        ? module[method](name, params)
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
  function loadModule(callback){
    var module = angular.module("solution", ['ngRoute']), combinedCss = "";
    eachProp(deps, function(res, type){
      inject(module, type, res);
      combinedCss += addCss(res);
    });
    renderCss(combinedCss);
    module.config([
      '$routeProvider', '$locationProvider',
      function($routeProvider, $locationProvider) {
        var controllers = deps["controller"];
        eachProp(controllers, function(ctrl, i){
          $routeProvider.when("/" + ctrl.config.router, {
            template : ctrl.template,
            controller: ctrl.config.name || ctrl.name
          })
        });
        $locationProvider.hashPrefix('');
        $routeProvider.otherwise({redirectTo:'/'})
      }
    ]);
    callback(module);
  }
  return loadModule;
})