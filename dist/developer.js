const express = require("express"),
  pathLib = require("path"),
  app = express();
module.exports = {
  run : function(){
    app.get("/smart-angular/development", (req, res) => {
      res.write("smart-angular");
      res.end();
    })
    app.listen(9000);
    console.info("请打开浏览器 http://localhocal:9000/smart-angular/development 来开启预览模式");
  }
};