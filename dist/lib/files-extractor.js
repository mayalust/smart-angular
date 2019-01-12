const { ultils, explainers, template } = require("ps-angular-loader"),
  { isArray, isFunction, getFilePath } = require("ps-ultility"),
  log = require('proudsmart-log')( true ),
  psfile = require("ps-file"),
  workpath = process.cwd(),
  filepath = getFilePath(__filename),
  loaderUtils = require('loader-utils'),
  { parse } = require("querystring"),
  pathLib = require("path"),
  filetree = require("ps-filetree"),
  isPlainObj = obj => typeof obj === "object" && obj !== null,
  { genRequest, mergeCode } = ultils;
module.exports = d => d;
module.exports.pitch = function(remainRequest){
  let callback = this.async(),
    { resourceQuery } = this,
    { exclude } = loaderUtils.getOptions(this),
    query = parse(resourceQuery.slice(1)),
    { smartangular, type, pack, name, separate, mode } = query,
    keys = explainers.keys(),
    output = [`import { render } from "-!${remainRequest}"`],
    ins = filetree(pathLib.resolve(workpath, "./ps-core"));
  log._info(this.resourcePath);
  function recursive(node, callback){
    let item, queue = isPlainObj(node) ? [node] : [];
    while( item = queue.shift() ){
      if( isFunction(callback) && callback(item) === true ) { return };
      isArray(item.children)
        ? [].push.apply(queue, item.children) : null;
    }
  }
  function getFileName(path) {
    let match = /(?:\\|\/)([^\\\/\.]+)\.(?:[^\.]+)$/.exec(path);
    return match ? match[1] : ""
  }
  function isStyle( str ){
    return /(?:less)|(?:css)|(?:sass)|(?:scss)/.test(str);
  }
  output.push(`let handlers = []`);
  let handlers = {
    template : {
      makeMap({path}){
        return `require(${genRequest.call( this, [ pathLib.resolve(filepath, './template-extractor'), path ], query, true )})`;
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
      if( exclude.some( d => d.test( path)) ){
        return false;
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
        output.push(`typeof window !=="undefined" && typeof window["define"] ==="function" && window["define"](function(){ return renderAll })`)
      }
      callback(null, output.join(";\n"));
  });
}