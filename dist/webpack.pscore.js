const factory = require("./js/services/services");
const pathLib = require("path");
console.log(pathLib.resolve(__dirname, "./angular-loader.js"));
const __DEVELOPMENT__ = {
  entry : {
    app : "./app.js"
  },
  output: {
    path: pathLib.join(__dirname, './output'),
    filename: 'output-file.js'
  },
  devtool : 'inline-source-map',
  mode : "development",
  module : {
    rules : [
      {
        test: /\.angular$/,
        use: {
          loader : pathLib.resolve(__dirname, "./angular-loader.js"),
          options : {}
        }
      }
    ]
  },
  devServer: {
    open : true,
    openPage : "app-oc/index.html",
    contentBase: "./",
    inline: true,
    proxy : {
      '/api' : {
        target : factory.origin,
        security : false,
        changeOrigin : true
      }
    }
  }
};
module.exports = __DEVELOPMENT__;