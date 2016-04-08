function Client() {

}
Client.prototype.initialize = function (config) {
  this.config = config;
};

Client.prototype.run = function () {
  console.log("Started client on " + this.config.host + ":" + this.config.port);
  var express = require('express');
  var app = express();
  var ejs = require('ejs');
  var fs = require('fs');

  var port = this.config.socketPort;
  var domain = this.config.domain;
  var input = fs.readFileSync(__dirname + "/client/config.tpl").toString();
  fs.writeFileSync(__dirname + "/client/config.js",ejs.render(input, {domain: domain, port: port}));
  app.set('views', __dirname + '/client');
  app.use(express.static(__dirname + '/client'));
  app.get("/", function (req, res) {
    res.render("index");
  });

  app.listen(this.config.port);
};

module.exports = function(){
  return new Client();
}
