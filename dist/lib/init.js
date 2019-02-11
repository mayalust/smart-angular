const pstree = require("ps-file"),
  log = require("proudsmart-log")(),
  workpath = process.cwd(),
  filepath = getFilePath(__filename),
  pathLib = require("path");
module.exports
module.exports = function( name ) {
  let ins = pstree(pathLib.resolve(workpath)),
    files = {
    controller: {
      title: `test`,
      content: `<config injector="$scope"></config>
<template>
  <div class="wrap">
    <span>{{n}}</span>
    <test></test>
  </div>
</template>
<script>
  export default function( scope ){
    scope.n = 10
  }  
</script>
<style lang="scss" scoped>
  .wrap {
    span {
      color : red
    }
  }
</style>`
    },
    directive: {
      title: `test`,
      content: `<config injector="$rootScope,test"></config>
<template>
  <div class="wrap">
    <span>{{n}}</span>
  </div>
</template>
<script>
  export default function( rootScope, test ){
    return {
      link( scope, elem, attr) {
        scope.n = "sample directive" + test.a;
      }
    }
  }  
</script>
<style lang="scss" scoped>
  .wrap {
    span {
      color : blue
    }
  }
</style>`
    },
    service: {
      title: `test`,
      content: `<config injector="$rootScope"></config>
<script>
  export default function( rootScope ){
    return {
      a : 10
    }
  }  
</script>`
    }
  };
  function conIndexHtml( name ){
    return `<!-- demo html for project "ps-${name}" -->
<!DOCTYPE html>
<html
    lang="en">
<head>
  <meta
      charset="UTF-8">
  <title>
    Title</title>
  <script src="../node_modules/requirejs/require.js"></script>
  <script src="../node_modules/ps-require/index.js"></script>
</head>
<body>
  <div ui-view></div>
  <script>
    require.config({
      waitSeconds: 0,
      paths: {
        'angular': './node_modules/angular/angular',
        'angular-ui-router' : "./node_modules/angular-ui-router/release/angular-ui-router",
      },
      shim: {
        'angular': {
          exports: 'angular'
        },
        'angular-ui-router': {
          deps: ['angular']
        }
      }
    });
    var deps = [
      "./build/template.config",
      "./build/controller.config",
      "./build/service.js",
      "./build/style.css"
    ], time = new Date();
    require(["angular","angular-ui-router"], function(angular){
      var module = angular.module("app", ["ui.router"]);
      psrequire(deps, function(){
        var args = [].slice.call(arguments);
        args.forEach(function(d, i){
          d( module, deps[i] );
        });
        console.log(( ( new Date() - time ) / 1000 ).toFixed(2) + "s is spent to init angular");
        angular.bootstrap(document.body, ["app"]);
      })
    });
  </script>
</body>
</html>`;
  }
  function eachprop( obj, callback ){
    for(let i in obj){
      callback( i, obj[i] );
    }
  }
  function propMap( obj, callback ){
    let rs = [];
    eachprop( obj, ( attr, elem ) => {
      rs.push( callback( attr, elem));
    })
    return rs;
  }
  if( !ins.exist(`ps-${name}`) ){
    ins.mkdir(`ps-${name}`).then( d => {
      let promises = [ d.write(`index.html`, conIndexHtml( name )) ]
        .concat(propMap(files, ( attr, { title, content } ) => {
        return d.mkdir(`${attr}s`).then( n => {
          return n.write( `${title}.${attr}`, content );
        });
      }));
      return Promise.all(promises);
    }).then( d => {
      console.log("success");
    })
  } else {
    log.error("module is already exist.")
  }
}