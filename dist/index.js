const log = require('proudsmart-log')( true );
MiniCssExtractPlugin = require("mini-css-extract-plugin"),
  jsonloader = require("./lib/json-loader.js"),
  { extend, getFilePath, isArray, isFunction, tree, random, eachProp, dateparser } = require("ps-ultility"),
  fs = require("fs"),
  init = require("./lib/init.js"),
  { parse } = require("querystring"),
  webpack = require("webpack"),
  pathLib = require("path"),
  workpath = process.cwd(),
  psfile = require("ps-file"),
  filepath = getFilePath(__filename),
  defaultConfig = {
    mode : "development",
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
    style : createCached(),
    output : createCached()
  }, { explainers, angularLoaderPlugin, template } = require("ps-angular-loader"),
  __webpackConfig = {
    watch : false,
    module : {
      rules : [{
        test : /\.js$/,
        use:{
          loader:'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
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
      },{
        test : /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use : "url-loader"
      }]
    }/**,
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
    }**/
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
      { entry, output, mode } = webpackConfig;
    log._info({ entry : webpackConfig.entry, output : webpackConfig.output}).run(false);
    log.info(`start : ${keys(entry).join(",")}`, `in "${ mode }" mode`);
    webpack(webpackConfig, (err, state) => {
      if(err === null){
        if(state.hasErrors()){
          log.error(`Error : ${ successInfo } in ${toSecond(new Date() - time)}s`);
          for( var  i in state.compilation.errors){
            log.error(`detail : ${state.compilation.errors[i]}`);
          }
        } else {
          log.success(`success : ${ successInfo } in ${toSecond(new Date() - time)}s`);
        }
        res("compiled");
      } else {
        log.error(err.message);
        rej( err );
      }
    });
  });
}
function toSecond( milisec ){
  return (milisec/1000).toFixed(2)
}
function createError(d){
  return new Promise( (res, rej) => {
    rej({
      message : d
    });
  })
}
function createSuccess(d){
  return new Promise( res => {
    res(d);
  })
}
function makeWebpackConfig(name, config, webpackConfig) {
  webpackConfig.mode = config.mode;
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
    return function( target ){
      return typeof target === "undefined"
        ? true : new RegExp(target, "g").test( str )
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
    return makeMatch( `${type}.config` )( instruction ) ? {
      needMap : false,
      data : {
        entry : entry,
        output : {
          path : pathLib.resolve( workpath, `ps-${name}/build`),
          filename : `[name].config.js`
        },
        plugins : inputPlugin()
      }
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
    return makeMatch( `${type}` )( instruction ) ? {
      data : {
        entry : entry,
        output : {
          path : pathLib.resolve( workpath, `ps-${name}/build`),
          filename :  `[name].js`
        },
        plugins : inputPlugin({
          filename: `[name].css`,
          chunkFilename: `[id].css`
        })
      },
      before : function(){
        return removeCssFile(pathLib.resolve(workpath, `ps-${name}/build/${type}.css`))
      }
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
    }, before = ({ basename, path }) => {
      return function(){
        return removeCssFile(pathLib.resolve(workpath, `ps-${name}/build/${type}/${basename}.css`))
      }
    }, dt = {
      data : {
        entry : entry,
        output : {
          path : pathLib.resolve(workpath, `ps-${name}/build/${type}`),
          filename : `[name].js`
        },
        plugins : inputPlugin({
          filename: `[name].css`,
          chunkFilename: `[id].css`
        })
      },
      before : before
    };
    return typeof instruction === "undefined"
      ? dt : ({ basename }) => {
        return new RegExp( instruction ).test( `${type}/${ basename }` )
          ? dt : undefined
      }
  }
  function createOutputConfig(){
    return makeMatch( `_` )( instruction ) ? {
      data : {
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
      },
      before : function(){
        //return createSuccess("success");
        return removeCssFile(pathLib.resolve(workpath, `ps-${name}/build/output.css`))
      }
    } : undefined;
  }
  function createOutputCombined(){
    return makeMatch( `output` )( instruction ) ? {
      data : {
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
          filename :  `[name].js`
        },
        plugins : inputPlugin({
          filename: `[name].css`,
          chunkFilename: `[id].css`
        })
      },
      before : function(){
        //return createSuccess("success");
        return removeCssFile(pathLib.resolve(workpath, `ps-${name}/build/output.css`))
      }
    } : undefined;
  }
  return {
    output : {
      //config : createOutputConfig(),
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
function removeCssFile( url ){
  let d = psfile( url );
  return d.exist() ? psfile( url ).remove() : createSuccess()
}
function pack(){
  let args = [].slice.call(arguments),
    querystr = args.shift(),
    mode = args.shift(),
    querystrArr = querystr ? querystr.split("/") : null,
    name = querystrArr ? querystrArr.shift() : null,
    ex = mode ? { mode : mode } : {},
    config = extend({}, defaultConfig, ex),
    handlers = makeHandlers( name , makeQuery(querystrArr)),
    webpackConfig = makeWebpackConfig(name, config, extend({}, __webpackConfig));
  function makeQuery( arr ){
    return arr.length ? arr.map( d => {
      return d.replace(new RegExp("\\*", "g"), "[^\\\/.]+").replace(".", "\\.");
    }).join("\\\/") + "$" : undefined;
  }
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
          fd = typeof fn === "function" ? fn( node ) : fn,
          data = extend({}, fd["data"]),
          before = fd["before"]
        data.entry = typeof data.entry === "function" ? data.entry( node ) : data.entry;
        return extend({}, {
          data : data,
          before : before( node )
        });
      });
    }
    function recursivePromise(p) {
      return p ? p.then( d => {
        return recursivePromise(createPromise(waitings.shift()))
      }) : undefined;
    }
    if( waitings.length == 0 ){
      log.error(JSON.stringify(`no files match the query condition [${querystr}], please try another.`));
    } else {
      return Promise.all(waitings.filter( d => typeof d.before === "function" ).map( d => {
        return d.before();
      })).then( d => {
        waitings = waitings.map( d => {
          let obj = extend({}, d.data);
          obj["devtool"] = d.needMap === false ? undefined : "#source-map"
          return obj
        });
        return recursivePromise(createPromise(waitings.shift())).then( d => {
          log.success(`success : all packed up in ${toSecond(new Date() - time)}s`);
        }).catch(e => {
          log.error( e.message );
          log.error( e.stack );
        });
      })

    }
  });
}
function getAttrs( obj, attrs ){
  let attrsArr = attrs.split("/"), item;
  while( item = attrsArr.shift() ){
    if( typeof obj[item] === "object" ){
      obj = obj[item];
    } else {
      return obj[item];
    }
  }
  return obj;
}
explainers.add("template", null);
module.exports = pack;
module.exports.init = init;
//module.exports.init.make = init.make;
module.exports.server = function(app, name, config){
  config = extend({}, defaultConfig, config);
  let uid = random(16),
    _basepath = pathLib.resolve(workpath, `./ps-${name}`),
    handlers = makeHandlers( name ),
    { exclude } = config,
    keys = explainers.keys(),
    ex = config.mode ? { mode : config.mode } : {},
    webpackConfig = makeWebpackConfig(name, config, extend({}, __webpackConfig, ex));
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
    if( !new RegExp(`ps-${name}\\\/build\\\/`).test( url ) ){
      next();
      return;
    }
    log.minor( `start : ${url}`);

    function makeloadconfig(url){
      let dics = [{
        test : new RegExp(`(ps-${name})\\\/build\\\/output\\.js`),
        handler : m => {
          return {
            type : "output",
            output : pathLib.resolve(workpath, `${m[1]}/build`),
            ext : "js",
            needMap : getAttrs( handlers, 'output/combined/needMap' ),
            config : getAttrs( handlers, 'output/combined/data' ),
            before : getAttrs( handlers, 'output/combined/before' ),
            after : checkModified
          }
        }
      },{
        test : new RegExp(`(ps-${name})\\\/build\\\/([^.]+)\\.([^.]+)\\.((?:js)|(?:css))`),
        handler : m => {
          let path = m.shift(), name = m.shift(), type = m.shift(), mode = m.shift(), ext = m.shift();
          return {
            targetPath : `${ name }/${ type }s`,
            type : type,
            entry : type,
            ext : ext,
            needMap : getAttrs( handlers[type], 'config/needMap' ),
            config : getAttrs( handlers[type], 'config/data' ),
            mode : mode,
            after : checkModified
          }
        }
      },{
        test : new RegExp(`(ps-${name})\\\/build\\\/([^\\\\/.]+)\\.((?:js)|(?:css))`),
        handler : m => {
          let path = m.shift(), name = m.shift(), type = m.shift(), ext = m.shift();
          return {
            targetPath : `${name}/${type}s`,
            type : type,
            entry : type,
            ext : ext,
            needMap : getAttrs( handlers[type], 'combined/needMap' ),
            config : getAttrs( handlers[type], 'combined/data' ),
            before : getAttrs( handlers[type], 'combined/before' ),
            after : checkModified
          }
        }
      },{
        test : new RegExp(`(ps-${name})\\\/build\\\/([^\\\\\/]+)s?\\\/([^.]+)\\.((?:js)|(?:css))`),
        handler : m => {
          let path = m.shift(), name = m.shift(), type = m.shift(), entry = m.shift(), ext = m.shift();
          return {
            targetPath : `${name}/${type}s`,
            type : type,
            entry : entry,
            separate : entry,
            ext : ext,
            needMap : getAttrs( handlers[type], 'separate/needMap' ),
            config : getAttrs( handlers[type], 'separate/data' ),
            before : getAttrs( handlers[type], 'separate/before' )({
              basename : entry
            }),
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
            if( type === "style" && !isStyle( ext ) && (ext != type) ){
              return false;
            }
            if( separate && basename !== separate ){
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
      return psfile(pathLib.resolve(_basepath, `./${type}s`))
        .find( node => basename === node.basename && type === node.ext)
    }
    function checkModified( loadConfig ){
      let { type, separate, entry, output, config } = loadConfig;
      return isModified( loadConfig ).then( d => {
        if( d ){
          log.info( `_render : ${url} , "file is modified" ${ type },${ entry }` );
          cached[`${ entry }_promise`] =
            ( loadConfig.before ? loadConfig.before() : createSuccess() )
              .then( d => {
                return ( typeof config.entry === "function"
                  ? getFileByBasename( entry, type ).then( n => {
                    return n ? createSuccess( config.entry(n) ) : createError( "file not found" );
                  }) : createSuccess( config.entry )).then( d => {
                  let obj = extend({}, config);
                  obj["devtool"] = loadConfig.needMap === false ? undefined : "#source-map";
                  extend( webpackConfig, obj, {
                    entry : d
                  });
                  return runWebpack( webpackConfig, url );
                });
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
          : ( cached[`${ entry }_promise`] || createSuccess("success") )
      });
    }
    function loadOutput( loadConfig ){
      let { config } = loadConfig, obj = extend({}, config);
      extend( webpackConfig, obj );
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
        return psfile(pathLib.join(workpath,url)).read().then( d => {
          res.write(d);
          res.end();
        });
      }).catch( e => {
        log.error( e.message );
        e.stack ? log.error( e.stack ) : null
        log.error(`pack : while packing file : '${pathLib.join(workpath,url)}'`);
        res.write(`throw new Error("'${pathLib.join(workpath,url)}' is not avaliable")`);
        res.end();
      })
    } else {
      log.minor(`prepare : "${url}" -- is not a smartangular file, neglected`)
      next()
    }
  }
  app.use(angular_middleware);
};