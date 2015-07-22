var express = require('express');
var app = express();
var request = require("./request-handler.js");
app.use(express.static('../client'));


app.all('/classes/*', request.requestHandler);
app.get('/log', request.requestHandler);


var server = app.listen(3000, function(){
  console.log('Express server running!');
});