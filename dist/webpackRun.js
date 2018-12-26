const MiniCssExtractPlugin = require("mini-css-extract-plugin"),
  { parse } = require("querystring"),
  webpack = require("webpack"),
  pathLib = require("path"),
  pstree = require("ps-filetree"),
  isTemplate = n => /\.template$/.test(n.abspath),
  getPath = n => n.abspath,
  { explainers, angularLoaderPlugin, template } = require("ps-angular-loader"),
  webpackConfig = {
    mode : "development",
    devtool : "#source-map",
    output : {
      path : pathLib.resolve(__dirname, "../ps-core/build"),
      filename : "[name].js"
    },
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
      }]
    },
    plugins : [new angularLoaderPlugin(),new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css"
    })]
  };
function render(name){
  let compiler, entry = {
    template : pathLib.resolve(__dirname, `./lib/angular-loader.js?smartangular&type=template&pack=${name}`)
  };
  explainers.keys().forEach( key => {
    entry[key] = pathLib.resolve(__dirname, `./lib/angular-loader.js?smartangular&type=${key}&pack=${name}`);
  });
  webpackConfig.entry = entry;
  console.log("asd");
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

render("core");
module.exports = function(name, config){

}