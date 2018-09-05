#!/usr/bin/env node
const pathLib = require("path"),
  tostring = Object.prototype.toString,
  push = Array.prototype.push,
  splice = Array.prototype.splice,
  indexof = Array.prototype.indexOf,
  isObject = isType("Object"),
  fs = require("fs");
function isType(type){
  return function(obj){
    return tostring.call(obj) === "[object " + type + "]";
  }
}
function bind(fn, target){
  return function(){
    return fn.apply(target, arguments);
  }
}
function extend(a, b){
  for(var i in b){
    a[i] = b[i];
  }
}
function each(arr, callback){
  for(let i = 0; i < arr.length; i++){
    callback(arr[i], i);
  }
}
function getParentDir(path){
  return pathLib.join(path, "../");
}
function getFiles(parent, child){
  return new Promise(function(resolve, reject){
    fs.readdir(pathLib.join(parent,child), (err, d) => {
      if(isObject(err))
        reject(err);
      else
        resolve({
          code : 0,
          data : d
        })
    })
  })
}
class Node {
  constructor(parentNode){
    if(parentNode){
      parentNode.children = parentNode.children || [];
      parentNode.children.push(this);
    }
  }
  write(name, content, callback){
    let p = pathLib.join(this.path, name),
      node = this.root.map[p];
    fs.writeFile(pathLib.join(this.abspath, name), content, (err, d) => {
      if(err) {} else {}
      let nd = node || this.root.addNode(pathLib.join(this.path, name), "file", this);
      callback && callback.call(this, {
        code : 0,
        data : nd
      })
    })
  }
  remove(name, callback){
    let p = pathLib.join(this.path, name),
      node = this.root.map[p];
    fs.unlink(p, (err, d) => {
      if (err) {
      } else {
        this.root.removeNode(p);
      }
      callback && callback.call(this, {
        code: 0,
        data: this
      })
    })
  }
  mkdir(name, callback){
    let p = pathLib.join(this.path, name),
      node = this.root.map[p];
    if(node){
      callback({
        code : 0,
        data : node
      });
    } else {
      fs.mkdir(pathLib.join(this.abspath, name), 0o777, (err, d) => {
        if(err){
          callback && callback.call(this, err);
        } else {
          let nd = node || this.root.addNode(pathLib.join(this.path, name), "directory", this);
          callback && callback.call(this, {
            code : 0,
            data : nd
          })
        }
      });
    }
  }
  rmdir(name){
    let p = pathLib.join(this.path, name),
      node = this.root.map[p];
    fs.rmdir(p, (err, d) => {
      if(err){
        callback && callback.call(this, err);
      } else {
        this.root.removeNode(p);
        callback && callback.call(this, {
          code : 0,
          data : this
        })
      }
    })
  }
}
class FileTree {
  constructor(rootpath){
    this.map = {};
    this.nodelist = [];
    this.length = 0;
    this.rootpath = rootpath;
    this.rootNode = this.addNode("", null);
    function recursion(parentNode, childpath){
      return new Promise((resolve, reject) => {
        fs.readdir(pathLib.join(rootpath, childpath), (err, d) => {
          if(!err){
            let promises = d.map((m) => {
              let rs = {
                path : pathLib.join(childpath, m)
              }
              return new Promise((resolve, reject) => {
                fs.stat(pathLib.join(rootpath, rs.path), (err, d) => {
                  if(!err){
                    if(d.isDirectory()){
                      rs.type = "directory";
                    } else if(d.isFile()){
                      rs.type = "file";
                    }
                    resolve(rs);
                  } else {
                    reject(err)
                  }
                });
              })
            })
            Promise.all(promises).then((filesAndDirctorys) => {
              let directorys = [], nd, item;
              while(nd = filesAndDirctorys.shift()){
                item =this.addNode(nd.path, nd.type, parentNode);
                if(nd.type === "directory")
                  directorys.push(bind(recursion, this)(item, pathLib.join(item.path)));
              };
              Promise.all(directorys).then((d) => {
                resolve(d);
              })
            });
          } else {
            reject({
              code : "EMPTYROOT"
            })
          }
        })
      })
    }
    var self = this;
    bind(recursion, this)(this.rootNode, "").then((d) => {
      this.events['start'] && this.events['start'].call(this, this.rootNode);
    }).catch((e) => {
      this.events['error'] && this.events['error'].call(this, e);
    })
  }
  addNode(path, type, parentNode){
    let item = new Node(parentNode || this),
      dir = pathLib.join(this.rootpath, path),
      basename = pathLib.basename(dir),
      nameExp = /([\w-@$#%()]+)(?:\.[\w]+)?/g,
      name = nameExp.exec(basename);
    extend(item, {
      rootpath : this.rootpath,
      abspath :  dir,
      path : path,
      ext : pathLib.extname(dir),
      basename : basename,
      name : name ? name[1] : null,
      root : this,
      parent : parentNode || this
    });
    this.type = type;
    this.map[item.path] = item;
    this.nodelist.push(item);
    if(!parentNode)
      push.call(this, item);
    return item;
  }
  removeNode(p){
    let nd = this.map[p], item, stack = [], parentNode = nd.parent;
    while((item = this.nodelist.shift()) !== nd){
      stack.unshift(item);
    }
    push.apply(this.nodelist, stack);
    if(parentNode === this){
      let inx = indexof.call(this, nd);
      splice.call(this, inx, 1);
    }
    delete this.map[p];
  }
  on(eventname, callback){
    this.events = this.events || {};
    this.events[eventname] = callback;
  }
  getPath(path){
    return this.map[path];
  }
}

function fileTree(path){
  return new FileTree(path);
}
module.exports = fileTree;
