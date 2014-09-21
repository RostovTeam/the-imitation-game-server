var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Game = function (io, clients) {
    this.io = io;
    var rand = Math.round(Math.random());

    this.seeker = clients.random;
    if (rand === 0) {
        this.liar = clients.man;
        this.honest = clients.woman;
    } else {
        this.liar = clients.woman;
        this.honest = clients.man;
    }

    this.clients = [
        this.seeker,
        this.liar,
        this.honest
    ];

    init.call(this);
};

util.inherits(Game, EventEmitter);

Game.reasons = {
    CLIENT_DISCONNECT: 'client_leave_room',
    GAME_ENDED: 'game_ended'
};

function init() {
    var self = this;

    this.room = this.honest.id + '_' + this.liar.id + '_' + this.seeker.id;

    for (var i = 0, l = this.clients; i < l; i++) {
        this.clients[i].join(this.room);
        this.clients[i].on('disconnect', function () {
            self.end(Game.reasons.CLIENT_DISCONNECT);
        });
    }

    this.honest.emit('game.role', {role: 'honest'});
    this.liar.emit('game.role', {role: 'liar'});
    this.seeker.emit('game.role', {role: 'seeker', liar: this.liar.id});

    this.seeker.emit('webrtc.multiconnection.open', {room: this.room});
    this.seeker.on('webrtc.multiconnection.ready', function () {
        self.broadcast.to(self.room).emit('webrtc.multiconnection.connect', {room: self.room});
    });

    this.seeker.on('game.vote', function (data) {
        self.io.sockets.in(self.room).emit('game.result', {result: data.vote/*true|false*/});
    });
}

Game.prototype.end = function (reason) {
    this.io.sockets.in(this.room).emit('game.over', Game.reasons[reason]);
    this.emit('ended');
};