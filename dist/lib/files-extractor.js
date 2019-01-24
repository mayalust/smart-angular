const { ultils } = require("ps-angular-loader"),
  { isArray, isFunction, getFilePath, random } = require("ps-ultility"),
  log = require('proudsmart-log')( true ),
  psfile = require("ps-file"),
  workpath = process.cwd(),
  filepath = getFilePath(__filename),
  loaderUtils = require('loader-utils'),
  { parse } = require("querystring"),
  pathLib = require("path"),
  isPlainObj = obj => typeof obj === "object" && obj !== null,
  { genRequest } = ultils;
module.exports = d => d;
module.exports.pitch = function(remainRequest){
  let callback = this.async(),
    hash = random()
    { resourceQuery } = this,
    { exclude } = loaderUtils.getOptions(this),
    query = parse(resourceQuery.slice(1)),
    { smartangular, type, pack, separate, mode } = query,
    output = [`import { render } from ${genRequest.call( this, [ pathLib.resolve(filepath, './angular-loader') ], {
      hash : hash,
    }, true )}`];
    //output = [`import { render } from "-!${remainRequest}"`];
  log._info(this.resourcePath);
  function recursive(node, callback){
    let item, queue = isPlainObj(node) ? [node] : [];
    while( item = queue.shift() ){
      if( isFunction(callback) && callback(item) === true ) { return };
      isArray(item.children)
        ? [].push.apply(queue, item.children) : null;
    }
  }
  function isStyle( str ){
    return makeGroupMatch(["less","css","scss","sass"]).test(str);
  }
  function makeGroupMatch( arr ){
    return new RegExp( `(?:${arr.join(")|(?:")})` )
  }
  output.push(`let handlers = []`);
  let handlers = {
    output : {
      makeMap({ path, ext }){
        return ext === "template"
          ? `require(${genRequest.call( this, [ pathLib.resolve(filepath, './template-extractor'), path ], extend( {
            hash : hash
          }, query ), true )})`
          : (isStyle( ext )
            ? `require(${genRequest.call( this, [ path ], null, false )})`
            : `handlers.push(require(${genRequest.call( this, [ path ], null, false )}).default)`)
      }
    },
    template : {
      makeMap({path}){
        return `require(${genRequest.call( this, [ pathLib.resolve(filepath, './template-extractor'), path ], {
          hash : hash
        }, true )})`;
      }
    },
    style : {
      makeMap({path}){
        return `require(${genRequest.call( this, [ path ], null, false )})`;
      }
    },
    controller : {
      makeMap({path}){
        if( mode === "config" ){
          return `handlers.push(require(${genRequest.call( this, [ pathLib.resolve(filepath, './ctrl-template-extractor'), path ], query, true )}).default)`
        } else {
          return `handlers.push(require(${genRequest.call( this, [ path ], null, false )}).default)`
        }
      }
    },
    directive : {
      makeMap({path}){
        return `handlers.push(require(${genRequest.call( this, [ path ], null, false )}).default)`
      }
    },
    service : {
      makeMap({path}){
        return `handlers.push(require(${genRequest.call( this, [ path ], null, false )}).default)`
      }
    }
  }
  psfile(pathLib.resolve(workpath, `./ps-${ pack }`)).children( ({ basename, path, ext }) => {
    if( exclude.some( d => d.test( path)) ){
      return false;
    }
    if( type === "output" && mode === "all" && ( makeGroupMatch(["template", "controller","service","directive"]).test( ext) || isStyle( ext ) )){
      return true;
    }
    if( !new RegExp( type + "s?", "g").test( path ) ){
      return false;
    }
    if( type === "style" ){
      if(!isStyle( ext )){
        return false;
      }
    } else {
      if( type !== ext){
        return false;
      }
    }
    if( separate && basename !== separate) {
      return false;
    }
    return true;
  }).then( d => {
    [].push.apply(output,d.map( handlers[ type ]["makeMap"]));
    if(type !== "template" && type !== "style"){
      if( separate ){
        output.push(`let renderAll = handlers[0]`);
      } else {
        output.push(`let renderAll = render(handlers, true)`);
      }
      output.push(`typeof psdefine === "function" && psdefine(function(){
        return renderAll 
      })`)
    }
    callback(null, output.join(";\n"));
  });
}