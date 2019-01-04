const MiniCssExtractPlugin = require("mini-css-extract-plugin"),
  { extend, getFilePath, isArray, isFunction } = require("ps-ultility"),
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
    }
  };
explainers.add("template", null);
function splice(arr, callback){
  let inx = arr.findIndex( ( d, i) => callback( d, i) ),
    rs = arr[inx];
  arr.splice(inx, 1);
  return rs;
}
function recersive(node, callback){
  let item, queue = isPlainObj(node) ? [node] : [];
  while( item = queue.shift() ){
    isFunction(callback) && callback(item);
    if(isArray(item.children)){
      [].push.apply(queue, item.children)
    }
  }
}
function render(name){
  let compiler, time = new Date(), entry = {
    template : pathLib.resolve(filepath, `./lib/angular-loader.js?smartangular&type=template&pack=${name}`)
  }, output = {
    path : pathLib.resolve(workpath, "./ps-core/build"),
    filename : `${name}.[name].js`
  }, defaultConfig = {
    exclude : [/\.test/, /([\\\/])exclude\1/]
  }, config = defaultConfig,
  keys = explainers.keys(),
  controller = splice( keys, ( d, i )=> d === "controller");
  ins.on("start", root => {
    let node = root.children.find( d => {
      return new RegExp( "controllers?", "g").test( d.path );
    });
    recersive(node, node => {
      if( config.exclude.some( d => d.test(node.abspath)) ){ return; }
      let __type = node.ext.slice(1);
      if( __type === "controller" ){
        entry[node.name] = pathLib.resolve(filepath, `./lib/angular-loader.js?smartangular&type=${__type}&pack=${name}`);
      }
      keys.forEach( key => {
        entry[key] = pathLib.resolve(filepath, `./lib/angular-loader.js?smartangular&type=${key}&pack=${name}`);
      });
      entry['style'] = pathLib.resolve(filepath, `./lib/angular-loader.js?smartangular&type=style&pack=${name}`);
      extend( webpackConfig, {
        entry : entry,
        output : output,
        plugins : [new angularLoaderPlugin(),new MiniCssExtractPlugin({
          filename: `${name}.[name].css`,
          chunkFilename: `${name}.[id].css`
        })]
      });
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
    console.warn("smart-angular start pack");
    compiler = webpack(webpackConfig, (err, state) => {
      console.warn(`smart-angular pack done in ${new Date() - time}s`);
      if(err === null){
        if(state.hasErrors()){
          console.error("code Error");
        } else {
          console.log("success");
        }
      } else {
        console.error(err.message);
      }
    });
  })
}
module.exports = render