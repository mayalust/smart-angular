const MiniCssExtractPlugin = require("mini-css-extract-plugin"),
  { extend, getFilePath } = require("ps-ultility"),
  { parse } = require("querystring"),
  webpack = require("webpack"),
  pathLib = require("path"),
  workpath = process.cwd(),
  filepath = getFilePath(__filename),
  pstree = require("ps-filetree"),
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
          loader : MiniCssExtractPlugin.loader
        },"css-loader"]
      },{
        test : /\.less$/,
        use : [{
          //loader : 'style-loader'
          loader : MiniCssExtractPlugin.loader
        },"css-loader","less-loader"]
      },{
        resource : d => {
          return true;
        },
        resourceQuery : query => {
          let pa = parse(query.slice(1));
          return pa.smartangular !== undefined;
        },
        use : {
          loader : pathLib.resolve(filepath, "./lib/files-extractor.js")
        }
      }]
    }
  };
explainers.add("template", null);
function render(name){
  let compiler, entry = {
    template : pathLib.resolve(filepath, `./lib/angular-loader.js?smartangular&type=template&pack=${name}`)
  }, output = {
    path : pathLib.resolve(workpath, "./ps-core/build"),
    filename : `${name}.[name].js`
  };
  explainers.keys().forEach( key => {
    entry[key] = pathLib.resolve(filepath, `./lib/angular-loader.js?smartangular&type=${key}&pack=${name}`);
  });
  extend( webpackConfig, {
    entry : entry,
    output : output,
    plugins : [new angularLoaderPlugin(),new MiniCssExtractPlugin({
      filename: `${name}.[name].css`,
      chunkFilename: `${name}.[id].css`
    })]
  });
  compiler = webpack(webpackConfig, (err, state) => {
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
}


module.exports = render