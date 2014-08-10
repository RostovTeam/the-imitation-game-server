var app = require('express')(),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server),
  uuid = require('node-uuid');

var hallRoomId  = 'hallRoom';

server.listen(8001);

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', function (client) {
  // on connect all clients are joined 'hall room'
  client.join(hallRoomId, function () {
    // how many cients in wait list
    io.sockets.in(hallRoomId).emit('room.addUser', {users: Object.keys(io.nsps['/'].adapter.rooms[hallRoomId]).length});

    // if 'hall room' contains more than 3 clients
    if(Object.keys(io.nsps['/'].adapter.rooms[hallRoomId]).length >= 3) {
      // it creates new room, puts the first 3 clients into new room, removed them from 'hall room'
      var newRoomId = uuid.v1(),
          group3 = Object.keys(io.nsps['/'].adapter.rooms[hallRoomId]).slice(0, 4);

      group3.forEach(function (id) {
        io.sockets.connected[id].leave(hallRoomId);
        io.sockets.connected[id].join(newRoomId);
        io.sockets.connected[id].room = newRoomId;
      });

      var seeker = io.sockets.connected[group3[0]],
        liar = io.sockets.connected[group3[1]],
        honest = io.sockets.connected[group3[2]];

      // assign roles and inform the clients about their roles in this new game
      seeker.isSeeker = true;
      seeker.emit('game.role', {role: 'seeker'});
      liar.isLiar = true;
      liar.emit('game.role', {role: 'honest'});
      honest.isHonest = true;
      honest.emit('game.role', {role: 'liar'});
      seeker.emit('webrtc.multiconnection.open', {roomId: newRoomId});
    }
  });
  client.on('webrtc.multiconnection.ready', function () {
    if (client.room && client.isSeeker) {
      client.broadcast.to(client.room).emit('webrtc.multiconnection.connect', {roomId: client.room});
    }
  });
  client.on('game.vote', function (data) {
    if (client.room && client.isSeeker) {
      io.sockets.in(client.room).emit('game.over', {results: data.vote});
    }
  });
  client.on('disconnect', function () {
    console.log(client.id + 'disconnected');
  });
});
