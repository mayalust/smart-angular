let Server = require("./dist/lib/server.js");
let server = new Server();
server.start(null, "test");
server.renderFile("/ps-test/build/controller/test.js", content => {
    //console.log(content);
    console.log(content[0]);
})
server.renderFile("/ps-test/build/controller/test.css", content => {
    //console.log(content);
    console.log(content[0]);
})