/*************************************************************

You should implement your request handler function in this file.

requestHandler is already getting passed to http.createServer()
in basic-server.js, but it won't work as is.

You'll have to figure out a way to export this function from
this file and include it in basic-server.js so that it actually works.

*Hint* Check out the node module documentation at http://nodejs.org/api/modules.html.

**************************************************************/

var path = require("path");
var Firebase = require("firebase");
//Get our chatreactor firebase
var chatReactor = new Firebase("https://chatreactor.firebaseio.com/");
//Get the rooms child
var chatRooms = chatReactor.child('rooms');
//Get the messages child
var chatMessages = chatReactor.child('messages');

var messages = {};

//Message constructor object
var Message = function(user, text, room){
  this.username = user;
  this.text = text;
  this.roomname = room;
  this.createdAt = new Date();
};

var Room = function(name) {
  this.name = name;
  this.createdAt = new Date();
};

//Listen for child nodes added to the base of our firebase.
//These will be new rooms and need a results array to themselves. 
// chatRooms.on('child_added', function(snapshot, prevChildKey){
//   var newRoom = snapshot.val();
//   console.log("New child room added: ", newRoom.name);
//   if (!messages.hasOwnProperty(newRoom.name)){
//     messages[newRoom.name] = { results: [] };
//     console.log("Room %s added to messages object", newRoom.name);
//   }
// });

//Listen for new messages
chatMessages.on('child_added', function(snapshot, prevChildKey){
  snapshot.forEach(function(message){
    var newMessage = message.val();
    console.log(newMessage);
    if (!messages.hasOwnProperty(newMessage.roomname)){
      messages[newMessage.roomname] = { results: [] };
      console.log("Room %s added to messages object", newMessage.roomname);
    }

    messages[newMessage.roomname].results.push(newMessage);
    
  });
});


var pushMessageToFirebase = function(message) {
  //Get a room or assign the default of Home if empty
  var room = message.roomname || "Home";

  //Add room if not exists
  if (!messages.hasOwnProperty(room)) {
    var chatRoom = chatRooms.child(room);
    chatRoom.set(new Room(room));
  }
  
  //Push a new message object to firebase
  var messagesRoom = chatMessages.child(room);
  messagesRoom.push(new Message(message.username, message.text, message.roomname));
}
// var chatMessages = chatReactor.child('messages');
//May need to restrict on room name. More research into design required. 

var routes = {
  '/classes/messages' : function(){
    return JSON.stringify(messages);
  },
  '/classes/room1': function(){
    return JSON.stringify(messages.Home);
  },
  '/log': function(){
    return JSON.stringify({});
  }
};

exports.requestHandler = function(request, response) {
  console.log("Serving request type " + request.method + " for url " + request.url);

  // The outgoing status.
  var statusCode = 404;

  // See the note below about CORS headers.
  var headers = defaultCorsHeaders;
  var body = 'Hello World';

  headers['Content-Type'] = "text/plain";
  
  if (request.method === 'OPTIONS'){
    statusCode = 200;
    headers['Allow'] = 'GET, POST, OPTIONS';
  }
  //This will have to properly change to support rooms
  //Hacking it in the interest of time.
  var urlSplit = request.url.split('/');
  if (urlSplit.length > 2 && urlSplit[1].toLowerCase() === "classes"){
    headers['Content-Type'] = "application/json";
    
    if (request.method === 'GET' && messages.hasOwnProperty(urlSplit[2])){
      statusCode = 200;
      body = JSON.stringify(messages[urlSplit[2]]);
    }

    if (request.method === 'POST'){
      statusCode = 201;
      var responseData = '';
      request.on('data', function(data){
        responseData += data;
      });
      request.on('end', function () {
        pushMessageToFirebase(JSON.parse(responseData));
      });
      body = JSON.stringify({ success: true });
    }
  }

  //Currently need this to handle log
  if(routes.hasOwnProperty(request.url)){
    headers['Content-Type'] = "application/json";
    if (request.method === 'GET'){
      statusCode = 200;
      body = routes[request.url]();
    }

    if (request.method === 'POST'){
      statusCode = 201;
      var requestData = '';
      request.on('data', function(data){
        requestData += data;
      });
      request.on('end', function () {
        console.log("POST request data: ",requestData);
        pushMessageToFirebase(requestData);
      });
      body = JSON.stringify({ success: true });
    }
    if (request.method === 'OPTIONS'){
      statusCode = 200;
      headers['Allow'] = 'GET, POST, OPTIONS';
    }
  }
  // .writeHead() writes to the request line and headers of the response,
  // which includes the status and all headers.
  response.writeHead(statusCode, headers);
  
  // Make sure to always call response.end() - Node may not send
  // anything back to the client until you do. The string you pass to
  // response.end() will be the body of the response - i.e. what shows
  // up in the browser.
  //
  // Calling .end "flushes" the response's internal buffer, forcing
  // node to actually send all the data over to the client.
  response.end(body);
};

// These headers will allow Cross-Origin Resource Sharing (CORS).
// This code allows this server to talk to websites that
// are on different domains, for instance, your chat client.
//
// Your chat client is running from a url like file://your/chat/client/index.html,
// which is considered a different domain.
//
// Another way to get around this restriction is to serve you chat
// client from this domain by setting up static file serving.
var defaultCorsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept",
  "access-control-max-age": 10 // Seconds.
};

