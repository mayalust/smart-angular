const psFile = require("ps-file");
const workPath = process.cwd();
const pathLib = require("path");
const {
  isArray
} = require("ps-ultility");
class FileStates {
  constructor() {
    this.filesMap = new Map;
  }
  set(id, file) {
    let st = this.filesMap.get(id);
    if (st == null) {
      this.filesMap.set(id, new State(id, file));
    } else {
      st.setFile(file);
    }
  }
  setGroup(files) {
    files.forEach(file => {
      this.set(file.path, file);
    })
  }
  get(id) {
    return this.filesMap.get(id);
  }
  isModified(ids) {
    ids = isArray(ids) ? ids : [ids];
    return id.some(id => {
      let st = this.get(id);
      return st.isModified;
    });
  }
}
class State {
  constructor(id, file) {
    this.id = id;
    this.file = file;
  }
  setFile(file) {
    this.oldFile = this.file;
    this.file = file;
  }
}
Object.defineProperty(State.prototype, "isModified", {
  get() {
    return this.oldFile.modifytime != this.file.modifytime;
  }
})

function getFileStateInstance() {
  let instance;
  return function () {
    if (instance == null) {
      instance = new FileStates();
    }
    return instance;
  }
}
module.exports = getFileStateInstance;