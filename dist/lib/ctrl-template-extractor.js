const { getFilePath,  getFileName} = require("ps-ultility"),
  workpath = process.cwd(),
  filepath = getFilePath(__filename),
  pathLib = require("path"),
  psfile = require("ps-file"),
  { parse } = require("querystring"),
  { ultils, template } = require("ps-angular-loader"),
  { selectBlock } = require("ps-angular-loader/lib/select"),
  { genRequest, mergeCode } = ultils;
module.exports = function(source){
  let { resourceQuery } = this,
    callback = this.async(),
    query = parse(resourceQuery.slice(1)),
    { pack } = query,
    basepath = pathLib.resolve(workpath, `./ps-${pack}/`),
    dics = {
      dir : "directive",
      ser : "service"
    },
    extsDics = {
      directive : "js|css",
      service : "js"
    };
  function makeDeps(){
    return new Promise(( res, rej) => {
      let allDeps = [`controller/${name}.js|css`],
        queue = config.deps ? config.deps.split(",").map( splitData ) : [];
      [].push.apply( allDeps, queue.map( ({path})=> path) );
      function splitData( str ){
        if( typeof str === "undefined"){
          return;
        }
        let a = str.split("."),
          name = a[0],
          type = dics[a[1]] || a[1] || "dir",
          ext = extsDics[ type ];
        return {
          name : name,
          type : type,
          ext : ext,
          path : type + "/" + name + "." + ext
        }
      }
      psfile(pathLib.resolve(basepath))
        .children( node => {
          return node.ext === "directive" || node.ext === "service"
        })
        .then( nodes => {
          function load(queue){
            let item = queue.shift();
            if( item ){
              let fd = nodes.find( ({ basename, ext }) => {
                return basename === item.name && ext === item.type;
              });
              fd.read().then( source => {
                let config = selectBlock( source, "config" ),
                  deps = config.deps
                    ? config.deps
                      .split(",").map( splitData )
                      .filter( ({path}) => {
                        return allDeps.indexOf( path ) == -1
                          ? allDeps.push( path ) : false;
                      })
                    : [];

                [].push.apply( queue, deps );
                load( queue );
              })
            } else {
              res( allDeps );
            }
          }
          load( queue );
        })
    })

  }
  function makeParam( str ){
    let arr = str.split("/").filter( d => d);
    return arr.length > 0 ? `/${ arr.join("/") }` : "";
  }
  let name = getFileName( this.resourcePath ),
    configBlock = selectBlock( source, "config" ),
    config = configBlock.attributes,
    param = makeParam( config.params || config.param || "" );
  makeDeps( config ).then( d => {
    callback(null, `export default function(){
    return {
      type : "router",
      loaderpath : ["${d.join("\",\"")}"],
      router : "/${ name }${ param }",
      ctrlname : "${ name }"
    }
  }`)
  });
};