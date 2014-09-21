var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    uuid = require('node-uuid');

var GameError = require('./src/error');
var Game = require('./src/game');
var GameManager = require('./src/game.manager');
var Users = require('./src/users');

server.listen(8001);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

var users = new Users();
var manager = new GameManager();

users.on('ready', function () {
    var clients = users.get();

    var game = new Game(io, clients);
    manager.watch(game);
});

function count() {
    io.sockets.emit('count', manager.count());
}

manager.on('watch', count);
manager.on('unwatch', count);

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
