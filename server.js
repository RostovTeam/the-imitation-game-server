var app = require('express')(),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server),
  uuid = require('node-uuid');

var hallRoom  = 'hallRoom';

server.listen(8080);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function (client) {
  // on connect all clients are joined 'hall room'
  client.join(hallRoom, function () {
    
    
    io.sockets.in(hallRoom).emit('room.addUser', {users: Object.keys(io.nsps['/'].adapter.rooms[hallRoom]).length});

    // then check if 'hall room' contains more than 3 clients
    if(Object.keys(io.nsps['/'].adapter.rooms[hallRoom]).length >= 3) {
      // it creates new room and moves 3 clients there
      var newRoom = uuid.v1(),
          group3 = Object.keys(io.nsps['/'].adapter.rooms[hallRoom]).slice(0, 4);

      group3.forEach(function (id) {
        io.sockets.connected[id].leave(hallRoom);
        io.sockets.connected[id].join(newRoom);
        io.sockets.connected[id].room = newRoom;
      });

      var host = io.sockets.connected[group3[0]];
      host.isHost = true;  
      //host.room = newRoom;
      host.emit('room.created', {room: newRoom});
      delete newRoom;
      delete host;
    }
  });
  client.on('room.ready', function () {
    // just to double check
    if (client.isHost && client.room) {
      client.broadcast.to(client.room).emit('room.invite', {room: client.room});
    }
  });
  client.on('game.vote', function() {
    io.sockets.in(client.room).emit('game.over');
  });
  client.on('disconnect', function () {
    console.log(client.id + 'disconnected');
  });
  client.emit('connection.success', {message: 'Connected. Waiting another players...'});
});
