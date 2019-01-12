const pstree = require("ps-file"),
  log = require("proudsmart-log")(),
  workpath = process.cwd(),
  filepath = getFilePath(__filename),
  pathLib = require("path");
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
  if( !ins.exist(`ps-${name}`) ){
    ins.mkdir(`ps-${name}`).then( d => {
      let promises = [];
      function eachprop(obj, callback){
        for(var i in obj){
          callback( i, obj[i] );
        }
      }
      eachprop(files, ( attr, { title, content } ) => {
        promises.push(d.mkdir(`${attr}s`).then( n => {
          return n.write( `${title}.${attr}`, content );
        }));
      })
      return Promise.all(promises);
    }).then( d => {
      console.log("success");
    })
  } else {
    log.error("module is already exist.")
  }
}