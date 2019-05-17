module.exports = function (source) {
  function replaceAllReturn(str) {
    const dics = "nrtf\"\'";
    let regex = [];
    for (let i = 0; i < dics.length; i++) {
      regex.push("\\" + dics.charAt(i));
    }
    return str.replace(new RegExp(`((?:${regex.join(")|(?:")}))`, 'g'), str => {
      var inx = regex.findIndex(d => new RegExp(`^${d}$`).test(str));
      return `\\${dics[inx]}`;
    });
  }
  return `export default ${ replaceAllReturn( source )}`
}