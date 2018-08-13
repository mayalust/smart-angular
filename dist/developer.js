const express = require("express"),
  pathLib = require("path"),
  app = express();
module.exports = {
  run : function(name){
    app.set('views',pathLib.join(__dirname , 'views') );
    app.engine('.html', require('ejs').__express);
    app.set('view engine', 'html');
    app.get("/", (req, res) => {
      res.render("development", {
        angular : "/angular/angular.min.js",
        angularRouter : "/angular-route/angular-route.min.js",
        jquery : "/jquery/dist/jquery.min.js",
        output : "/ps-" + name + "/output.js",
        name : "ps_" + name
      });
      res.end();
    });
    app.use(express.static(pathLib.resolve(__dirname, "../node_modules")));
    app.use(express.static(pathLib.resolve(process.cwd())));
    app.listen(9000);
    console.info("请打开浏览器 http://localhocal:9000/ 来开启预览模式");
  }
};