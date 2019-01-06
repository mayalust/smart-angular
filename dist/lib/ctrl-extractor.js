module.exports = d => d;
module.exports.pitch = function(remainRequest){
  let output = [`import render from "${remainRequest}"`];
  output.push(`window["define"](function(){`);
  output.push(`return render;`);
  output.push(`}`);
  return output.join(";\n")
}