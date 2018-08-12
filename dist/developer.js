const express = require("express"),
  pathLib = require("path"),
  app = express();
module.exports = {
  run : function(){
    app.get("/smart-angular/development", function(req, res){
      res.write("smart-angular");
      res.end();
    })
    app.listen(9000);
  }
};