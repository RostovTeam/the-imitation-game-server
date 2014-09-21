var app = require('express')(),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server),
  uuid = require('node-uuid');

var females = [],
    males = [];

server.listen(8001);

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/frontend/index.html');
});

io.sockets.on('connection', function (client) {
  console.log("New connected");

  client.on('setSex', function(data){
    if(data.sex === 'm'){
      males.push(client);
    }else{
      females.push(client);
    }
    if(males.length >= 2 && females.length === 1){
      console.log('add 2 mal');

      group = females.concat(males.slice(0,2));
      males.splice(0,2);
      females.splice(0,1);

      newRoomId = uuid.v1();

      group.forEach(function(item){
        io.sockets.connected[item.id].emit('test', {ms: 'стартуем'});
        io.sockets.connected[item.id].room = newRoomId;
      });

    }else if(males.length === 1 && females.length >=2){
      console.log('add 2 females');

      group = males.concat(females.slice(0,2));
      females.splice(0,2);
      males.splice(0,1);

      newRoomId = uuid.v1();
      //перемешаем группу
      group.sort(function() {
         return Math.random() - 0.6;
      });

      group.forEach(function(item){
        console.log(item.id);
        io.sockets.connected[item.id].room = newRoomId;
        io.sockets.connected[item.id].join(newRoomId);
      });

      seeker = io.sockets.connected[group[0].id],
      liar = io.sockets.connected[group[1].id],
      honest = io.sockets.connected[group[2].id];

      seeker.isSeeker = true;

      seeker.emit('test', {ms: 'seeker'});
      liar.emit('test', {ms: 'liar'});
      honest.emit('test', {ms: 'honest'});

      seeker.emit('webrtc.open', {roomId: newRoomId});


    }else if(males.length >= 2 && females.length >= 2){
      console.log('что то пошло не так');
    }
    //console.log(males.length);
  });
  
  client.on('webrtc.ready', function () {

    if (client.room && client.isSeeker) { 
      client.broadcast.to(client.room).emit('webrtc.connect', {roomId: client.room});
    }
  });
});
