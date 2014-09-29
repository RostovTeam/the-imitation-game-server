var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    uuid = require('node-uuid');

var GameError = require('./src/error');
var Game = require('./src/game');
var GameManager = require('./src/game.manager');
var Users = require('./src/users');

server.listen(8001);

app.use('/public', express.static(__dirname + '/public'));


app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

var users = new Users();
var manager = new GameManager();

function allGameCount() {
    io.sockets.emit('count.allgame', null /*TODO: см ниже*/)
}
function gameCount() {
    io.sockets.emit('count.game', manager.count());
}
function userCount() {
    io.sockets.emit('count.users', users.count());
}

users.on('add', userCount);
users.on('left', userCount);
manager.on('watched', gameCount);
manager.on('unwatched', gameCount);
// allGameCount()
// TODO: Добавить count всех игр за всё время ( сохранять в редис или мемкешд или еще куда нить, например в файл :) )

users.on('ready', function () {
    var clients = users.get();

    var game = new Game(io, clients);
    manager.watch(game);
});

io.sockets.on('connection', function (client) {
    client.on('gender', function (gender) {
        try {
            users.add(client, gender);
        } catch (e) {
            if (e instanceof GameError) {
                client.emit('game.error', new GameError("invalid gender", GameError.INVALID_GENDER));
            } else {
                // TODO: logged error
            }
        }
    });
});

io.sockets.on('disconnect',function(client){
    console.log(client);
})