const log = require('proudsmart-log')( true );
MiniCssExtractPlugin = require("mini-css-extract-plugin"),
  { extend, getFilePath, isArray, isFunction, tree, random, eachProp, dateparser } = require("ps-ultility"),
  fs = require("fs"),
  init = require("./lib/init.js"),
  { parse } = require("querystring"),
  webpack = require("webpack"),
  pathLib = require("path"),
  workpath = process.cwd(),
  psfile = require("ps-file"),
  filepath = getFilePath(__filename),
  psfile = require("ps-file"),
  defaultConfig = {
    exclude : [/\.test/, /([\\\/])exclude\1/],
    renderWhileStart : true
  },
  getUrl = d => /([^?]*)(?:\?[^?]*)?/.exec(d)[1],
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
    template : createCached(),
    controller : createCached(),
    directive : createCached(),
    service : createCached(),
    style : createCached()
  }, { explainers, angularLoaderPlugin, template } = require("ps-angular-loader"),
  __webpackConfig = {
    mode : "production",
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
          loader : MiniCssExtractPlugin.loader
        },"css-loader"]
      },{
        test : /\.less$/,
        use : [{
          loader : MiniCssExtractPlugin.loader
        },"css-loader","less-loader"]
      },{
        test : /\.(?:scss)|(?:sass)/,
        use : [{
          loader : MiniCssExtractPlugin.loader
        },"css-loader","sass-loader"]
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
function keys( obj ){
  let arr = [];
  for(let i in obj){
    arr.push( i );
  }
  return arr;
}
function runWebpack(webpackConfig, url){
  function makeOutputPath( { entry, output } ){
    let { filename, path } = output;
    return keys(entry).map( d => {
      return pathLib.resolve( path, `./${filename.replace(`[name]`, d )}`);
    })
  }
  return new Promise( (res, rej) => {
    let time = new Date(),
      successInfo = makeOutputPath( webpackConfig ),
      { entry, output } = webpackConfig;
    log._info({ entry : webpackConfig.entry, output : webpackConfig.output}).run(false);
    log.info(`start : ${keys(entry).join(",")}`);
    webpack(webpackConfig, (err, state) => {
      if(err === null){
        if(state.hasErrors()){
          log.error(`code Error : ${ successInfo } in ${toSecond(new Date() - time)}s`);
        } else {
          log.success(`success : ${ successInfo } in ${toSecond(new Date() - time)}s`);
        }
        res("compiled");
      } else {
        log.error(err.message);
        rej(err.message);
      }
    });
  });
}
function toSecond( milisec ){
  return (milisec/1000).toFixed(2)
}
function makeWebpackConfig(name, config, webpackConfig) {
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
function makeHandlers( name, instruction ){
  function makeMatch( str ){
    let arr = str.split("."),
      ext = arr.pop(),
      condition = `^${arr.map( d => d == "[name]" ? "[^.]+" : d).join(".")}(\\\\.${ext})?$`;
    return function( target ){
      return typeof target === "undefined"
        ? true : new RegExp(condition, "g").test( target )
    };
  }
  function makePath( { url, query } ){
    let arr = [];
    for(var i in query){
      arr.push(`${i}${query[i] != null ? `=${query[i]}` : ``}`);
    }
    url += "?" + arr.join("&");
    return url;
  }
  function createConfig( type ){
    let entry = {}
    entry[ `${type}` ] = makePath({
      url: pathLib.resolve(filepath, `./lib/angular-loader.js`),
      query: {
        smartangular: null,
        type: type,
        pack: name,
        mode: "config"
      }
    });
    return makeMatch( `${name}.${type}.config.js` )( instruction ) ? {
      entry : entry,
      output : {
        path : pathLib.resolve( workpath, `ps-${name}/build`),
        filename : `${name}.[name].config.js`
      },
      plugins : inputPlugin()
    } : undefined
  }
  function createCombined( type ){
    let entry = {}
    entry[ type ] = makePath({
      url : pathLib.resolve( filepath, `./lib/angular-loader.js` ),
      query : {
        smartangular : null,
        type : type,
        pack : name
      }
    })
    return makeMatch( `${name}.${type}.js` )( instruction ) ? {
      entry : entry,
      output : {
        path : pathLib.resolve( workpath, `ps-${name}/build`),
        filename :  `${name}.[name].js`
      },
      plugins : inputPlugin({
        filename: `${name}.[name].css`,
        chunkFilename: `${name}.[id].css`
      })
    } : undefined
  }
  function createSeparate( type ) {
    let entry = ({ basename, path }) => {
      let rs = {}
      rs[ basename ] = makePath({
        url : `${pathLib.resolve(filepath, `./lib/angular-loader.js`)}`,
        query : {
          smartangular : null,
          type : type,
          pack : name,
          separate : basename
        }
      })
      return rs;
    }, dt = {
      entry : entry,
      output : {
        path : pathLib.resolve(workpath, `ps-${name}/build/${type}`),
        filename : `[name].js`
      },
      plugins : inputPlugin({
        filename: `[name].css`,
        chunkFilename: `[id].css`
      })
    };
    return typeof instruction === "undefined"
      ? dt : ( makeMatch( `${type}.[name].js` )( instruction )
        ? node => {
          return type + "." + node.basename == instruction
            ? dt : undefined
        } : undefined )
  }
  function createOutputConfig(){
    return makeMatch( `output.js` )( instruction ) ? {
      entry : {
        output : makePath({
          url : pathLib.resolve( filepath, `./lib/output.js` ),
          query: {}
        })
      },
      output : {
        path : pathLib.resolve( workpath, `ps-${name}/build`),
        filename :  `[name].js`
      },
      plugins : inputPlugin()
    } : undefined;
  }
  function createOutputCombined(){
    return makeMatch( `${name}.output.js` )( instruction ) ? {
      entry : {
        output : makePath({
          url : pathLib.resolve(filepath, `./lib/angular-loader.js`),
          query: {
            smartangular: null,
            type: "output",
            pack: name,
            mode: "all"
          }
        })
      },
      output : {
        path : pathLib.resolve( workpath, `ps-${name}/build`),
        filename :  `${name}.[name].js`
      },
      plugins : inputPlugin({
        filename: `${name}.[name].css`,
        chunkFilename: `${name}.[id].css`
      })
    } : undefined;
  }
  return {
    output : {
      config : createOutputConfig(),
      combined : createOutputCombined()
    },
    template : {
      config : createConfig("template"),
    },
    controller : {
      config : createConfig("controller"),
      combined : createCombined("controller"),
      separate : createSeparate("controller")
    },
    directive : {
      combined : createCombined("directive"),
      separate : createSeparate("directive")
    },
    service : {
      combined : createCombined("service"),
      separate : createSeparate("service")
    },
    style : {
      combined : createCombined("style")
    }
  }
}
function inputPlugin( css ){
  return css ? [new angularLoaderPlugin(),new MiniCssExtractPlugin( css )]
    : [new angularLoaderPlugin()]
}
function pack(){
  let args = [].slice.call(arguments),
    name = args.shift(),
    instruction = args.length ? args.join(".") : undefined,
    config = defaultConfig,
    handlers = makeHandlers( name , instruction ),
    webpackConfig = makeWebpackConfig(name, config, extend({}, __webpackConfig));
  psfile(pathLib.resolve(workpath, `./ps-${name}`)).children( n => {
    return !n.isDir && handlers[n.ext] && handlers[n.ext]["separate"]
  }).then( allfiles => {
    let time = new Date(), waitings = [...getConfig(),...getCombinedConfig(),...getSeparateConfig()];
    function createPromise(config){
      if( config ){
        extend( webpackConfig, config );
        return runWebpack( webpackConfig );
      }
    }
    function getConfig(){
      let waitings = [];
      for( let i in handlers ){
        let fn = handlers[ i ]["config"];
        fn ? waitings.push(fn) : null;
      }
      return waitings;
    }
    function getCombinedConfig(){
      let waitings = [];
      for( let i in handlers ){
        let fn = handlers[ i ]["combined"];
        fn ? waitings.push(fn) : null;
      }
      return waitings;
    }
    function getSeparateConfig(){
      return allfiles.filter(node => {
        let fn = handlers[node.ext]["separate"];
        return !config.exclude.some( d => d.test(node.path))
          && handlers[node.ext]
          && ( typeof fn === "function" ? fn( node ) : fn )
      }).map( node => {
        let __type = node.ext,
          fn = handlers[__type]['separate'],
          rs = extend({}, typeof fn === "function" ? fn( node ) : fn );
        rs.entry = typeof rs.entry === "function" ? rs.entry( node ) : rs.entry;
        return extend({}, rs);
      });
    }
    function recursivePromise(p) {
      return p ? p.then( d => {
        return recursivePromise(createPromise(waitings.shift()))
      }) : undefined;
    }
    if( waitings.length == 0 ){
      log.error(JSON.stringify(`no files match the query condition [${instruction}], please try another.`));
    } else {
      return recursivePromise(createPromise(waitings.shift())).then( d => {
        log.success(`success : all packed up in ${toSecond(new Date() - time)}s`);
      }).catch(e => {
        log.error(JSON.stringify(e));
      });
    }
  });
}
explainers.add("template", null);
module.exports = pack;
module.exports.init = init;
module.exports.server = function(app, name, config){
  config = extend({}, defaultConfig, config);
  let uid = random(16),
    _basepath = pathLib.resolve(workpath, `./ps-${name}`),
    handlers = makeHandlers( name ),
    { exclude } = config,
    keys = explainers.keys(),
    webpackConfig = makeWebpackConfig(name, config, extend({}, __webpackConfig));
  function getFileName(path) {
    let match = /(?:\\|\/)([^\\\/\.]+)\.(?:[^\.]+)$/.exec(path);
    return match ? match[1] : ""
  }
  function isStyle( str ){
    return /(?:less)|(?:css)|(?:sass)|(?:scss)/.test(str);
  }
  function angular_middleware(req, res, next){
    let url = getUrl(req.url),
      loadConfig = makeloadconfig( url ),
      dics = {
        js : "application/javascript",
        css : "text/css"
      };
    log.minor( `start : ${url}`);
    if( !new RegExp(`ps-${name})\\\/build\\\/`).test( url ) ){
      next();
      return;
    }
    function makeloadconfig(url){
      let dics = [{
        test : new RegExp(`(ps-${name})\\\/build\\\/output\\.js`),
        handler : m => {
          return {
            type : "output",
            output : pathLib.resolve(workpath, `${m[1]}/build`),
            ext : "js",
            config : handlers['output']['config'],
            after : loadOutput
          }
        }
      },{
        test : new RegExp(`(ps-${name})\\\/build\\\/${name}\\.([^.]+)\\.([^.]+)\\.((?:js)|(?:css))`),
        handler : m => {
          return {
            targetPath : `${m[1]}/${m[2]}s`,
            type : m[2],
            entry : m[2],
            ext : m[4],
            config : handlers[m[2]]["config"],
            mode : m[3],
            after : checkModified
          }
        }
      },{
        test : new RegExp(`(ps-${name})\\\/build\\\/${name}\\.([^.]+)\\.((?:js)|(?:css))`),
        handler : m => {
          return {
            targetPath : `${m[1]}/${m[2]}s`,
            type : m[2],
            entry : m[2],
            ext : m[3],
            config : handlers[m[2]]["combined"],
            after : checkModified
          }
        }
      },{
        test : new RegExp(`(ps-${name})\\\/build\\\/([^\\\\\/]+)s?\\\/([^.]+)\\.((?:js)|(?:css))`),
        handler : m => {
          return {
            targetPath : `${m[1]}/${m[2]}s`,
            type : m[2],
            entry : m[3],
            separate : m[3],
            ext : m[4],
            config : handlers[m[2]]["separate"],
            after : checkModified,
            source : url
          }
        }
      }], item;
      while( item = dics.shift() ){
        let { test, handler } = item,
          match = test.exec( url );
        if( match ){
          return handler( match )
        };
      }
    }
    function createImmediatePromise(d){
      return new Promise( res => {
        res(d);
      })
    }
    function getAllModifyTime( loadConfig ){
      let { targetPath, type, separate } = loadConfig;
      return new Promise((res, rej) => {
        let obj = {};
        log._error( type, targetPath ).run( false );
        psfile(pathLib.resolve(workpath, `./ps-${name}`))
          .children(({ path, basename, ext }) => {
            if( exclude.concat([/\/build\//]).some( d => d.test( path ))){
              return false;
            }
            if( type === "style" && !isStyle( ext )){
              return false;
            }
            if( separate && basename !== separate ){
              return false;
            }
            if( ext != type ) {
              return false;
            }
            return true;
          }).then( d => {
          d.forEach( ({  basename, modifytime, modifytimeStr, ext }) => {
            obj[ `${ ext }____${ basename }` ] = modifytime;
          });
          res( obj );
        }).catch( e => {
          rej( e );
        });
      })
    }
    function isModified( loadConfig ){
      return new Promise((res, rej) => {
        getAllModifyTime( loadConfig ).then( modifytimes => {
          let { type, entry, separate } = loadConfig;
          function checkModified(modifytimes){
            let rs = false, cache_obj = getCached(), cv;
            function getCached(){
              return cached[ type ];
            }
            if( separate ) {
              let __key = `${type}____${entry}`;
              cv = config.renderWhileStart
                ? ( cached[__key] || 0 )
                : cached[__key];
              if( typeof cv !=="undefined" && ( modifytimes[ __key ] - cv !== 0 ) ) {
                rs = true;
                cached[__key] = modifytimes[ __key ];
              } else if(typeof cache_obj[ entry ] === "undefined"){
                cached[__key] = modifytimes[ __key ];
              }
            } else {
              for(let i in modifytimes){
                let __key = `${i}____${entry}`;
                cv = config.renderWhileStart
                  ? ( cache_obj.get(i) || 0 )
                  : cache_obj.get(i);
                if( typeof cv !=="undefined" && ( modifytimes[ __key ] - cv !== 0 ) ) {
                  rs = true;
                  cache_obj.set(i, modifytimes[ __key ]);
                } else if(typeof cached[ type ].get( i ) ==="undefined"){
                  cache_obj.set(i, modifytimes[ __key ]);
                }
              }
            }
            return rs;
          }
          modifytimes ? res( checkModified(modifytimes) ) : res( true );
        });
      })
    }
    function getFileByBasename( basename, type ){
      return psfile(pathLib.resolve(_basepath, `./${type}s/${basename}.${type}`)).stat()
    }
    function checkModified( loadConfig ){
      let { type, separate, entry, output, config } = loadConfig;
      return isModified( loadConfig ).then( d => {
        if( d ){
          log.info( `_render : ${url} , "file is modified" ${ type },${ entry }` );
          cached[`${ entry }_promise`] = ( typeof config.entry === "function"
            ? getFileByBasename( entry, type).then( n => {
              return createImmediatePromise( config.entry(n) );
            }) : createImmediatePromise( config.entry )).then( d => {
            extend( webpackConfig, config, {
              entry : d
            });
            return runWebpack( webpackConfig, url );
          });
        } else {
          log.minor( `neglect : ${url} , ${ cached[`${ entry }_promise`]
            ? "file is modified, in rendering state"
            : "file is not modified, use cached file"}` );
          cached[`${ entry }_promise`] ? cached[`${ entry }_promise`].then( d => {
            cached[`${ entry }_promise`] = undefined;
          }) : null;
        }
        return d ? cached[`${ entry }_promise`]
          : ( cached[`${ entry }_promise`] || createImmediatePromise("success") )
      });
    }
    function loadOutput( loadConfig ){
      let { config } = loadConfig;
      extend( webpackConfig, config );
      return runWebpack( webpackConfig )
        .then( d => {
          return checkModified(makeloadconfig( `ps-${name}/build/${name}.template.config.js`));
        })
    }
    if( loadConfig ) {
      loadConfig.after( loadConfig ).then(d => {
        let { ext } = loadConfig;
        log.info( `_loadfile : ${url} , "file is loaded"` );
        res.setHeader(`Content-Type`, `${dics[ ext ]};charset=UTF-8`);
        psfile(pathLib.join(workpath,url)).read().then( d => {
          res.write(d);
          res.end();
        }).catch( e => {
          log._error(`cannot get file : ${pathLib.join(workpath,url)}`).run( false );
        });
      })
    } else {
      log.minor(`prepare : "${url}" -- is not a smartangular file, neglected`)
      next()
    }
  }
  app.use(angular_middleware);
};