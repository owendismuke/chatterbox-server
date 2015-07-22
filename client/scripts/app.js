var Message = function(username, text, roomname){
  this.username = username;
  this.text = text;
  this.roomname = roomname;
};

var App = function() {
  this._baseUrl = 'http://localhost:3000/classes/';
  this._lastRetrieve;
  this._currentRoom = "Home";
  this._rooms = {Home: "Home"};
  this._friends = {};
  this._lastSentMessage;
  this._lastSentMessageTime;
  this._lastReceivedMessage;
  this._timeout;
};

App.prototype.constructor = App;
App.prototype.init = function(){
  var _context = this;
  $(document).ready(function(){
    $('<option/>').val('Home').text('Home').appendTo('#roomSelect');
    
    $('#roomSelect').change(function(){
      _context.changeRoom($(this).val());
    });

    $('#newRoom').click(function(){
      $('#roomAdd').show();
      $(this).hide();      
    });

    $('#addRoom').click(function(){
      $('#roomAdd').hide();
      $('#newRoom').show();
      var room = $('#roomName').val().replace(' ','');
      _context.addRoom(room);
      _context.changeRoom(room);
      $('#roomSelect').val(room);
      $('#roomName').val("");
    });

    $('#clear').click(function(){ _context.clearMessages(); });
    
    $('#chats').on('click', '.username',function(){ 
      _context.addFriend($(this).text()); 
    });
    
    $('#chatForm').submit(function(event){
      event.preventDefault();
      var msg = $('#messageInput').val();
      if(msg.trim() === "") { return; }

      var room = $('#roomSelect').val() || "";

     if (_context.handleSubmit(msg, room)){
      $('#messageInput').val("");
     }

    });
  });
  
  _context.fetch();
};

App.prototype.send = function(message){
  var context = this;
  
  //spam handling
  // if (context._lastMessageSent && (new Date()).getTime() - context._lastMessageSent.getTime() < 100) { 
  //   console.error("chatterbox: Spam attempt detected");
  //   return false; 
  // }
  
  if (context._lastMessage === message.text) { 
    console.error("chatterbox: Spam attempt detected");
    return false;
  }
  
  var attemtped = false;
  return $.ajax({
    url: context._baseUrl + context._currentRoom,
    type: 'POST',
    data: JSON.stringify(message),
    contentType: 'application/json',
    success: function (data) {
      context._lastSentMessage = message.text;
      context._lastSentMessageTime = (new Date()).toJSON();
      context.fetch();
      return true;
    },
    error: function (data) {
      // if(!attemtped) {
      //   attemtped = true;
      //   context.send(message);
      // } else {
        console.error('chatterbox: failed to send message');
        return false;
      // }
    }
  });
};

App.prototype.addMessage = function(message){
  //check for highlighted words for rolling of the rick
  if (!message || !message.text || !message.text.length) { return; }
  if (!message || !message.username || !message.username.length) { return; }
  if (message.roomname) { this.addRoom(message.roomname); }
  if (this._currentRoom && this._currentRoom !== message.roomname) { return; }
  if (this._lastReceivedMessage === message.text) { return; }
  var $chats = $('#chats');
  var $message = $('<div></div>').addClass('chat');
  var $user = $('<span></span>').addClass('username').text(message.username); 
  var $text = $('<span></span>').addClass('text').text(message.text);
  if (this._friends[message.username] === 1) { $text.css({ 'font-weight': 'bold'}); } 
  $message.append($user, $text);
  $chats.append($message);
  this._lastReceivedMessage = message.text;
};

App.prototype.fetch = function(){
  var context = this;
  var where = !context._lastRetrieve ? "" : encodeURIComponent('?where={"createdAt":{"$gte":" ' + context._lastRetrieve + '"}}');
  if (context._timeout !== undefined) { clearTimeout(context._timeout); }

  $.ajax({
    url: context._baseUrl + context._currentRoom,// + where,
    type: 'GET',
    //Pull these methods out
    success: function(data){
      context.clearMessages();
      context._lastRetrieve = (new Date()).toJSON();
      if (!data || !data.results || !data.results.length) { return; }
      data.results.forEach(function(message) {
        context.addMessage(message);
      });
    },
    error: function(data){
      console.error('chatterbox: failed to retrieve new messages');
      console.log(data);
    },
    complete: function(data){
      context._lastReceivedMessage = '';
      context._timeout = setTimeout(context.fetch.bind(context), 10000);
    }
  });
};

App.prototype.getUsername = function(){
  var params = window.location.search.substring(1).split('&');
  for(var i = 0; i < params.length; i++){
    var temp = params[i].split('=');
    if(temp[0] === 'username') { return temp[1]; }
  }
  return 'anonymous';
}

//To sanitize messages.
App.prototype.sanitize = function(string){
  return escape(string);
};

App.prototype.clearMessages = function(){
  $('#chats').empty();
};

App.prototype.addRoom = function(room){
  if (!room) { return; }
  if (this._rooms[room] === room) { return; }
  this._rooms[room] = room;
  $('<option/>').val(room).text(room).appendTo('#roomSelect');
};

App.prototype.addFriend = function(username){
  this._friends[username] = 1;
};

App.prototype.changeRoom = function(room){
  this._currentRoom = room;  
  this.fetch();
};

App.prototype.handleSubmit = function(message, room){
  var user = this.getUsername();
  var room = this._currentRoom || "Home";
  var message = new Message(user, message, room);
  return this.send(message);
};

App.prototype.rickRoll = function(){
  //modal this on highlighted words rick, astley, or never going to give you up (in order)
  //<iframe width="420" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0" frameborder="0" allowfullscreen></iframe>
};


var app = new App();
app.init();

