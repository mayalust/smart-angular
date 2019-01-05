const MiniCssExtractPlugin = require("mini-css-extract-plugin"),
  { extend, getFilePath, isArray, isFunction } = require("ps-ultility"),
  fs = require("fs"),
  { parse } = require("querystring"),
  webpack = require("webpack"),
  pathLib = require("path"),
  workpath = process.cwd(),
  filepath = getFilePath(__filename),
  pstree = require("ps-filetree"),
  ins = pstree(pathLib.resolve(workpath, "./ps-core")),
  isPlainObj = obj => typeof obj === "object" && obj !== null
  isTemplate = n => /\.template$/.test(n.abspath),
  getPath = n => n.abspath,
  { explainers, angularLoaderPlugin, template } = require("ps-angular-loader"),
  webpackConfig = {
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
          //loader : 'style-loader'
          loader : MiniCssExtractPlugin.loader,
        },"css-loader"]
      },{
        test : /\.less$/,
        use : [{
          //loader : 'style-loader'
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
function makeReg( arr ){
  return new RegExp(`([^\\.]+)\\.((?:${arr.join(`)|(?:`)}))\\.js$`, "g");
}
function makeEntry(type, path){
  let entry = {};
  entry[type] = path;
  return entry;
}
function angular_middleware(req, res, next){
  let keys = explainers.keys(),
   match = makeReg( keys ).exec(req.url);
  match ? runWebpack( makeEntry(match[2], req.url) ).then((d) => {
    res.setHeader(`Content-Type`, `application/javascript; charset=UTF-8`);
    fs.readFile(pathLib.join(workpath,`${match[1]}.${match[2]}.js`), function(err, d){
      err
        ? res.write(`${JSON.stringify(err)}`)
        : res.write(d);
      res.end();
    })
  }) : next();
}
function runWebpack(entry){
  return new Promise( (res, rej) => {
    let time = new Date()
    webpackConfig.entry = entry;
    webpack(webpackConfig, (err, state) => {
      if(err === null){
        if(state.hasErrors()){
          console.error("code Error");
        } else {
          console.info(`success : ${JSON.stringify(entry)} in ${toSecond(new Date() - time)}s`);
        }
        res("compiled");
      } else {
        console.error(err.message);
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
function recursive(node, callback){
  let item, queue = isPlainObj(node) ? [node] : [];
  while( item = queue.shift() ){
    isFunction(callback) && callback(item);
    if(isArray(item.children)){
      [].push.apply(queue, item.children)
    }
  }
}
function toSecond( milisec ){
  return (milisec/1000).toFixed(2)
}
function render(name){
  let compiler, entry = {
    template : pathLib.resolve(filepath, `./lib/angular-loader.js?smartangular&type=template&pack=${name}`)
  }, output = {
    path : pathLib.resolve(workpath, "./ps-core/build"),
    filename : `${name}.[name].js`
  }, defaultConfig = {
    exclude : [/\.test/, /([\\\/])exclude\1/]
  }, config = defaultConfig,
    watchOptions = {
      aggregateTimeout: 2000,
      poll: 1000
    },
  keys = explainers.keys(),
  controller = splice( keys, ( d, i )=> d === "controller");
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
      return runWebpack(entry);
    }
    recursive(node, node => {
      if( config.exclude.some( d => d.test(node.abspath)) ){ return; }
      let __type = node.ext.slice(1);
      if( __type === "controller" ){
        waitings.push({
          name : node.name,
          path : pathLib.resolve(filepath, `${node.abspath}`)
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
      });
    }).then(d => {
      console.log(`success : all packed up in ${toSecond(new Date() - time)}s`);
    }).catch(e => {
      console.error(JSON.stringify(e));
    });
  });
}
explainers.add("template", null);
module.exports = render;
module.exports.server = function(app){
  app.use(angular_middleware);
};