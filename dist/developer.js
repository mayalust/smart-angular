const express = require("express"),
  pathLib = require("path"),
  fs = require("fs"),
  compiler = require("./compiler"),
  app = express();
module.exports = {
  run : function(name, devapp){
    function webpackAngular(req, res, next){
      var regAng = /(.*)\.angular(?:\.js)?/g, match = regAng.exec(req.url);
      match ? compiler.pack(name).then((d) => {
        res.setHeader("Content-Type", "application/javascript; charset=UTF-8");
        fs.readFile(pathLib.join(process.cwd(),match[1] + ".js"), function(err, d){
          err
            ? res.write(JSON.stringify(err))
            : res.write(d);
          res.end();
        })
      }) : next();
    }
    if(devapp){
      devapp.use(webpackAngular);
    } else {
      app.set('views',pathLib.join(__dirname , 'views') );
      app.engine('.html', require('ejs').__express);
      app.set('view engine', 'html');
      app.use(webpackAngular);
      app.get("/", (req, res) => {
        res.render("development", {
          angular : "/angular/angular.min.js",
          angularRouter : "/angular-route/angular-route.min.js",
          jquery : "/jquery/dist/jquery.min.js",
          bootstrap : "/bootstrap/dist/css/bootstrap.css",
          dataTable : "/datatables.net-bs/css/dataTables.bootstrap.min.css",
          output : "/ps-" + name + "/output.angular",
          name : "ps_" + name
        });
        res.end();
      });
      app.use(express.static(pathLib.resolve(__dirname, "../node_modules")));
      app.use(express.static(pathLib.resolve(process.cwd())));
      app.listen(9000);
      console.info("请打开浏览器 http://localhost:9000/ 来开启预览模式");
    }
  }
};