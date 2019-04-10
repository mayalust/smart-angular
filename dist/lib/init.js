const pstree = require("ps-file"),
  log = require("proudsmart-log")(),
  workpath = process.cwd(),
  pathLib = require("path"),
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
    },
    style : {
      title: `test`,
      content : `body{}`,
      ext : "less"
    }
  },
  ins = pstree(pathLib.resolve(workpath));
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
  
    /************************** smart-angular v1.5.85 ************************************/
    /************************************* important ************************************/

    /** please install package [ npm i angular requirejs ps-require angular-ui-router ] before run **/
    
    /************************************* important ************************************/
    /************************** smart-angular v1.5.85 ************************************/
  
    require.config({
      waitSeconds: 0,
      paths: {
        'angular': '../node_modules/angular/angular',
        'angular-ui-router' : "../node_modules/angular-ui-router/release/angular-ui-router",
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
};
function createFn( projectname, name, type ){
  if( typeof name !== "string") {
    log.error("please input a proper file name, use command as [ smart-angular controller projectname filename ]");
  }
  if( ins.exist(`ps-${projectname}/${type}s`) ){
    ins.stat(`ps-${projectname}/${type}s`).then( d => {
      let inx = 0, item = name;
      while( d.exist(`./${item}.${type}`) ){
        log.info(`"./${item}.${type}" is already exist renamed with "${name}_copy${inx}"`);
        item = name + "_copy" + ( inx ? inx : "" );
        inx++;
      }
      let content = files[type].content;
      return d.write(`${item}.${type}`, content).then( d => {
        log.success(`"${item}.${type}" is successfully created!`);
      });
    })
  } else{
    log.error(`project "${name}" is not exist.`);
  }
}
class initHandler {
  constructor(){}
  init( name ){
    if( typeof name !== "string" ){
      log.error("please input a name for the new create project, use command as [ smart-angular init project name ]");
      return;
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
          .concat(propMap(files, ( attr, { title, content, ext } ) => {
            return d.mkdir(`${attr}s`).then( n => {
              return n.write( `${title}.${ ext || attr }`, content );
            });
          }));
        return Promise.all(promises)
          .then( n => {
            log.success(`project "${name}" is already created at '${d.path}'`);
          });
      })
    } else {
      log.error(`project "${name}" is already exist.`)
    }
  }
  controller( projectname, name ){
    createFn( projectname, name, "controller");
  }
  directive( projectname, name ){
    createFn( projectname, name, "directive");
  }
  service( projectname, name ){
    createFn( projectname, name, "service");
  }
}
module.exports = new initHandler;