const log = require('proudsmart-log')( true );
  MiniCssExtractPlugin = require("mini-css-extract-plugin"),
  { extend, getFilePath, isArray, isFunction, tree } = require("ps-ultility"),
  fs = require("fs"),
  { parse } = require("querystring"),
  webpack = require("webpack"),
  pathLib = require("path"),
  workpath = process.cwd(),
  filepath = getFilePath(__filename),
  pstree = require("ps-filetree"),
  defaultConfig = {
    exclude : [/\.test/, /([\\\/])exclude\1/],
    renderWhileStart : true
  },
  getUrl = d => /([^?]*)(?:\?[^?]*)?/.exec(d)[1],
  ins = pstree(pathLib.resolve(workpath, "./ps-core")),
  isPlainObj = obj => typeof obj === "object" && obj !== null,
isTemplate = n => /\.template$/.test(n.abspath),
  getPath = n => n.abspath,
  createCached = d => {
    class cached {
      set( attr, value ){
        this[attr] = value;
      }
      get( attr ){
        return this[attr];
      }
      keys(){
        let keys = [];
        for(var i in this){
          keys.push(i);
        }
        return keys;
      }
    }
    return new cached
  },
  cached = {
    controller : createCached(),
    directive : createCached(),
    service : createCached(),
    style : createCached()
  }, { explainers, angularLoaderPlugin, template } = require("ps-angular-loader"),
  __webpackConfig = {
    mode : "development",
    devtool : "#source-map",
    watch : false,
    module : {
      rules : [{
        test : /\.js$/,
        use:{
          loader:'babel-loader'
        },
        exclude:/node_modules/
      },{
        test : /\.angular/,
        use : ["ps-angular-loader"]
      },{
        test : /\.css$/,
        use : [{
          loader : MiniCssExtractPlugin.loader,
        },"css-loader"]
      },{
        test : /\.less$/,
        use : [{
          loader : MiniCssExtractPlugin.loader
        },"css-loader","less-loader"]
      }]
    },
    optimization: {
      splitChunks: {
        chunks: 'async',
        minSize: 30000,
        maxSize: 0,
        minChunks: 1,
        maxAsyncRequests: 5,
        maxInitialRequests: 3,
        automaticNameDelimiter: '~',
        name: true,
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true
          }
        }
      }
    }
  };
function makeReg( arr ) {
  let type = ['js','css'],
    regex = new RegExp(`(([^\\.]+)\\.((?:${arr.join(`)|(?:`)})))\\.((?:${type.join(`)|(?:`)}))$`, "g")
  return regex;
}
function recursive(node, callback){
  let item, queue = isPlainObj(node) ? [node] : [];
  while( item = queue.shift() ){
    isFunction(callback) && callback(item);
    if(isArray(item.children)){
      [].push.apply(queue, item.children)
    }
  }
}
function runWebpack(entry, webpackConfig){
  return new Promise( (res, rej) => {
    let time = new Date()
    webpackConfig.entry = entry;
    log._info({ entry : webpackConfig.entry, output : webpackConfig.output}).run(false);
    webpack(webpackConfig, (err, state) => {
      if(err === null){
        if(state.hasErrors()){
          log.error(`code Error : ${JSON.stringify(entry)} in ${toSecond(new Date() - time)}s`);
        } else {
          log.success(`success : ${JSON.stringify(entry)} in ${toSecond(new Date() - time)}s`);
        }
        res("compiled");
      } else {
        log.error(err.message);
        rej(err.message);
      }
    });
  });
}
function splice(arr, callback){
  let inx = arr.findIndex( ( d, i) => callback( d, i) ),
    rs = arr[inx];
  arr.splice(inx, 1);
  return rs;
}
function toSecond( milisec ){
  return (milisec/1000).toFixed(2)
}
function makeWebpackConfig(name, config, webpackConfig) {
  let output = {
    path : pathLib.resolve(workpath, "./ps-core/build"),
    filename : `${name}.[name].js`
  }, watchOptions = {
    aggregateTimeout: 2000,
    poll: 1000
  };
  extend( webpackConfig, {
    output : output,
    plugins : [new angularLoaderPlugin(),new MiniCssExtractPlugin({
      filename: `${name}.[name].css`,
      chunkFilename: `${name}.[id].css`
    })]
  });
  webpackConfig.module.rules.push({
    resource : d => {
      return true;
    },
    resourceQuery : query => {
      let pa = parse(query.slice(1));
      return pa.smartangular !== undefined;
    },
    use : {
      loader : pathLib.resolve(filepath, "./lib/files-extractor.js"),
      options : config
    }
  });
  return webpackConfig;
}
function render(name){
  let compiler, entry = {
      template : pathLib.resolve(filepath, `./lib/angular-loader.js?smartangular&type=template&pack=${name}`)
    }, config = defaultConfig,
    keys = explainers.keys(),
    webpackConfig = makeWebpackConfig(name, config, extend({}, __webpackConfig)),
    controller = splice( keys, ( d, i )=> d === "controller");
  ins.on("start", root => {
    let time = new Date(), node = root.children.find( d => {
      return new RegExp( "controllers?", "g").test( d.path );
    }), waitings = [];
    function createPromise(key){
      let path;
      if( typeof key === "object") {
        path = key.path;
        key = key.name;
      } else if(typeof key === "string") {
        path = `./lib/angular-loader.js?smartangular&type=${key}&pack=${name}`
      } else {
        return;
      }
      let entry = {};
      entry[key] = pathLib.resolve(filepath, path);
      return runWebpack(entry, webpackConfig);
    }
    recursive(node, node => {
      if( config.exclude.some( d => d.test(node.abspath)) ){ return; }
      let __type = node.ext.slice(1);
      if( __type === "controller" ){
        waitings.push({
          name : node.name,
          path : `./lib/ctrl-extractor.js!${pathLib.resolve(filepath,`${node.abspath}`)}`
        });
      }
    });
    [].push.apply(waitings,keys);
    function recursivePromise(p) {
      return p ? p.then( d => {
        return recursivePromise(createPromise(waitings.shift()))
      }) : undefined;
    }
    return recursivePromise(createPromise(waitings.shift())).then( d => {
      return runWebpack({
        style : pathLib.resolve(filepath, `./lib/angular-loader.js?smartangular&type=style&pack=${name}`)
      }, webpackConfig);
    }).then(d => {
      log.success(`success : all packed up in ${toSecond(new Date() - time)}s`);
    }).catch(e => {
      log.error(JSON.stringify(e));
    });
  });
}
explainers.add("template", null);
module.exports = render;
module.exports.server = function(app, name, config){
  config = extend({}, defaultConfig, config);
  let { exclude } = config,
    keys = explainers.keys(),
    webpackConfig = makeWebpackConfig(name, config, extend({}, __webpackConfig));
  function getFileName(path) {
    let match = /(?:\\|\/)([^\\\/\.]+)\.(?:[^\.]+)$/.exec(path);
    return match ? match[1] : ""
  }
  function getFolder(path){
    let match = /(.*)[\\\/](?:[^\\\/]+)$/.exec(path);
    return match ? match[1] : ""
  }
  function isStyle( str ){
    return /(?:less)|(?:css)|(?:sass)|(?:scss)/.test(str);
  }
  function angular_middleware(req, res, next){
    let url = getUrl(req.url),
      match = new RegExp(`[\\/]([^\\/]+)[\\\/]${name}\\.([^\\.]+)\\.((?:js)|(?:css))$`, "g").exec(url),
      dics = {
        js : "application/javascript",
        css : "text/css"
      };
    match ? null : log.minor(`prepare : "${url}" -- is not a smartangular file, neglected`);
    function makeEntry(type, path){
      let entry = {};
      if( keys.concat("style").indexOf(type) !== -1 ) {
        path = pathLib.resolve(filepath, `./lib/angular-loader.js?smartangular&type=${type}&pack=${name}`);
      }
      entry[type] = path;
      return entry;
    }
    function getFolder(){
      return pathLib.resolve(workpath, `./ps-${name}/${ match[1] === "build" 
        ? match[2] : match[1]}s`);
    }
    function createImmediatePromise(d){
      return new Promise( res => {
        res(d);
      })
    }
    function getAllModifyTime( path ){
      return new Promise((res, rej) => {
        let obj = {},
          pa = getFolder( url ),
          ins = pstree(pa);
        log._error( path, pa ).run();
        ins.on("start", root => {
          tree().forEach(root, node => {
            if( exclude.some( d => d.test(node.abspath)) ){ return; }
            let __type = node.ext.slice(1), filename = getFileName(node.abspath);
            if(path === "style" ? isStyle(__type) : false) {
              obj[ filename ] = node.modifytime;
            } else if( match[1] !== "build" ? filename === path : false) {
              obj[ filename ] = node.modifytime;
            } else if( __type === path ) {
              obj[ filename ] = node.modifytime;
            }
          });
          res(obj);
        });
      })
    }
    function isModified( path ){
      console.log( path );
      return new Promise((res, rej) => {
        getAllModifyTime( path ).then( modifytimes => {
          function checkModified(modifytimes){
            let rs = false, cache_obj = getCached(), cv;
            function getCached(){
              return match[1] === "build" ?
                cached[path] : cached[match[1]];
            }
            if( match[1] === "build") {
              for(var i in modifytimes){
                cv = config.renderWhileStart
                  ? ( cache_obj.get(i) || 0 )
                  : cache_obj.get(i);
                if( typeof cv !=="undefined" && ( modifytimes[ i ] - cv !== 0 ) ) {
                  rs = true;
                  if( path !== "controller") {
                    cache_obj.set(i, modifytimes[ i ]);
                  }
                } else if(typeof cached[path].get( i ) ==="undefined"){
                  if( path !== "controller") {
                    cache_obj.set(i, modifytimes[ i ]);
                  }
                }
              }
            } else {
              console.log( cache_obj.get(path) );
              cv = config.renderWhileStart
                ? ( cache_obj.get(path) || 0 ) : cache_obj.get(path)
              rs = modifytimes[ path ] - cv !== 0;
              cache_obj.set( path,  modifytimes[ path ]);
            }
            return rs;
          }
          modifytimes ? res( checkModified(modifytimes) ) : res( true );
        });
      })
    }
    function checkModified(){
      return isModified( match[2] ).then( d => {
        if( d ){
          log.info( `_render : ${url} , "file is modified"` );
          let p = keys.concat("style").indexOf(match[2]) == -1
            ? pathLib.resolve(workpath, "./ps-core/build/" + match[1])
            : pathLib.resolve(workpath, "./ps-core/build");
          webpackConfig.output = {
            path : p,
            filename : `${name}.[name].js`
          }
          cached[`${match[2]}_promise`] = runWebpack( makeEntry( match[2],  pathLib.resolve(filepath, `./lib/angular-loader.js?smartangular&type=${match[1]}&pack=${name}&separate=${match[2]}`)), webpackConfig )
        } else {
          log.minor( `neglect : ${url} , ${ cached[`${match[2]}_promise`] ? "file is modified, in rendering state" : "file is not modified, use cached file"}` );
          cached[`${match[2]}_promise`] ? cached[`${match[2]}_promise`].then( d => {
            cached[`${match[2]}_promise`] = undefined;
          }) : null;
        }
        return d ? cached[`${match[2]}_promise`]
          : ( cached[`${match[2]}_promise`] || createImmediatePromise("success") )
      });
    }
    match ? checkModified().then( d => {
      log.info( `_loadfile : ${url} , "file is loaded"` );
      res.setHeader(`Content-Type`, `${dics[match[3]]};charset=UTF-8`);
      fs.readFile(pathLib.join(workpath,url), (err, d) => {
        log._error(`get file : ${pathLib.join(workpath,url)}`).run( false );
        err ? res.write(`${JSON.stringify(err)}`)
          : res.write(d);
        res.end();
      })
    }) : next();
  }
  app.use(angular_middleware);
};