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
      seeker.userid = 'Игрок' + Math.floor(Math.random() * 10000);
      liar.userid = 'Имитатор' + Math.floor(Math.random() * 10000);
      honest.userid = 'Имитатор' + Math.floor(Math.random() * 10000);
      seeker.emit('game.role', {role: 'seeker', name: seeker.userid, intro: 'Ваша задача: Угадать. Мы знаем кто из игроков мужчина, а кто - женщина, а у вас на разгадку есть 5 минут. Задавайте игрокам вопросы, думайте, вычисляйте, догадывайтесь. Удачи!', question: liar.userid + ' лжец?'});
      liar.isLiar = true;
      liar.emit('game.role', {role: 'honest', name: liar.userid, intro: 'Ваша задача: Истина. Вам нужно убедить угадывающего, что вы действительно мужчина(/женщина). Ваш оппонент будет лгать, стараясь доказать обратное. Не дайте ему это сделать, докажите свою правоту!'});
      honest.isHonest = true;
      honest.emit('game.role', {role: 'liar', name: honest.userid, intro: 'Ваша задача: Имитировать. Отвечать так, как-будто вы - женщина(/мужчина). Ваши ответы должны убедить угадывающего, что именно вы говорите правду, а ваш оппонент лжет.'});
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
      io.sockets.in(client.room).emit('game.over', {message: data.vote ? 'Угадал!' : 'Не угадал!'});
    }
  });
  client.on('disconnect', function () {
    console.log(client.id + 'disconnected');
  });
});
