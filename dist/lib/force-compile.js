class ForceCompile {
  constructor() {
    this.forceCompile = false
  }
  turnOn() {
    this.forceCompile = true;
  }
  turnOff() {
    this.forceCompile = false;
  }
  value() {
    return this.forceCompile;
  }
}

function ForceCompileIns() {
  let instance;
  return function () {
    if (instance == null) {
      instance = new ForceCompile();
    }
    return instance;
  };
}
module.exports = ForceCompileIns();