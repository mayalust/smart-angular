const express = require(`express`),
  pathLib = require(`path`),
  fs = require(`fs`),
  net = require(`net`),
  opn = require(`opn`),
  compiler = require(`./compiler`),
  app = express(),
  middlewares = [webpackAngular];
function webpackAngular(req, res, next){
  var regAng = /(.*)\.angular(?:\.js)?/g, match = regAng.exec(req.url);
  match ? compiler.pack(sAn.name).then((d) => {
    res.setHeader(`Content-Type`, `application/javascript; charset=UTF-8`);
    fs.readFile(pathLib.join(process.cwd(),match[1] + `.js`), function(err, d){
      err
        ? res.write(JSON.stringify(err))
        : res.write(d);
      res.end();
    })
  }) : next();
}
function each(arr, callback){
  let i = 0;
  if(arr){
    for(; i < arr.length; i++){
      callback(arr[i], i, arr);
    }
  }
}
function use(plugin){
  plugin.install(sAn);
}
function run(name, devapp){
  let port = 9000;
  function checkPortAvaliable(port, callback){
    new Promise((res,rej) => {
      let server = net.createServer();
      server.on(`listening`, () => {
        server.close();
        server = null;
        res(`avaliable`)
      });
      server.on(`error`, (err) => {
        if (err.code === `EADDRINUSE`) {
          console.log(`The port【${port}】 is occupied, please change other port.`);
        }
        server.close();
        server = null;
        rej(err);
      });
      server.listen(port);
    }).then(() => {
      callback(port);
    }).catch((e) => {
      checkPortAvaliable(port - 0 + 1, callback);
    })
  }
  sAn.name = name;
  if(devapp){
    sAn.eachMiddleware((middleware)=>{
      devapp.use(middleware);
    });
  } else {
    app.set(`views`,pathLib.join(__dirname , `views`) );
    app.engine(`.html`, require('ejs').__express);
    app.set('view engine', 'html');
    app.use(webpackAngular);
    app.get(`/`, (req, res) => {
      res.render(`development`, {
        angular : `/angular/angular.min.js`,
        angularRouter : `/angular-route/angular-route.min.js`,
        jquery : `/jquery/dist/jquery.min.js`,
        bootstrap : `/bootstrap/dist/css/bootstrap.css`,
        dataTable : `/datatables.net-bs/css/dataTables.bootstrap.min.css`,
        output : `/ps-${ name }/output.angular`,
        name : `ps_${ name }`
      });
      res.end();
    });
    app.use(express.static(pathLib.resolve(process.cwd(), `./node_modules`)));
    app.use(express.static(pathLib.resolve(__dirname, `../node_modules`)));
    app.use(express.static(pathLib.resolve(process.cwd())));
    checkPortAvaliable(port, function(p){
      app.listen(p);
      console.info(`请打开浏览器 http://localhost:${p}/ 来开启预览模式`);
      opn(`http://localhost:${p}`, function(err){
        console.error(err.message);
      });
    });
  }
}
class smartAngular {
  constructor(middlewares){
    this.middlewares = middlewares || [];
  }
  middleware(fn){
    this.middlewares.push(fn);
  }
  eachMiddleware(callback){
    each( this.middlewares, callback );
  }
}
let sAn = new smartAngular(middlewares);
module.exports = {
  use : use,
  run : run
};