var EventEmitter = require('events').EventEmitter;
var util = require('util');

var shared = require('./../public/js/shared');

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

Game.reasons = shared.reasons;

Game.roles = shared.roles;

function init() {
    var self = this;

    var arrName = ["Тигренок",
                    "Лошадка",
                    "Пингвиненок",
                    "Львенок",
                    "Носорожек",
                    "Слоненок",
                    "Щенок",
                    "Котенок",
                    "Утенок",
                    "Цыпленок",
                    "Поросенок",
                    "Теленок",
                    "Мамонтенок",
                    "Кенгуренок",
                    "Лемуренок",
                    "Тюлененок",
                    "Олененок",
                    "Медвеженок",
                    "Рыбка",
                    "Кролик",
                    "Бельчонок",
                    "Лягушонок",
                    "Волчонок",
                    "Лисичка",
                    "Динозаврик"];
    //["Заяц","Верблюд","Медведь","Собака"];
    arrName.sort(function() {
        return Math.random() - 0.6;
    });

    this.room = this.honest.id + '_' + this.liar.id + '_' + this.seeker.id;

    for (var i = 0, l = this.clients.length; i < l; i++) {
        this.clients[i].join(this.room);
        this.clients[i].on('disconnect', function () {
            self.end(Game.reasons.clientDisconnect);
        });
    }

    // TODO: Передача id сокета на сторону клиента, возможны проблемы с безопасность
    // TODO: Проверить на безопасность, либо использовать собственный id
    var users=[{id:this.honest.id,name:arrName[0]}, {id:this.liar.id,name:arrName[1]}];
    users.sort(function() {
        return Math.random() - 0.6;
    });

    this.honest.emit('game.role', {role: Game.roles.honest, id: this.honest.id, name:arrName[0]});
    this.liar.emit('game.role', {role: Game.roles.liar, id: this.liar.id, name:arrName[1]});
    this.seeker.emit('game.role', {role: Game.roles.seeker, id: this.seeker.id, users: users, name:"Искатель"});

    this.seeker.emit('webrtc.channel.open', {room: this.room, name:arrName[0]});

    this.seeker.on('webrtc.channel.ready', function () {
        this.broadcast.in(self.room).emit('webrtc.channel.connect', {room: self.room});
    });

    this.seeker.on('game.vote', function (liar) {
        if(self.liar.id==liar){
            self.io.in(self.room).emit('game.result', {result: true});
        }else{
            self.io.in(self.room).emit('game.result', {result: false});
        }

    });
}

Game.prototype.end = function (reason) {
    this.io.in(this.room).emit('game.over', {reason: reason});
    this.emit('ended');
};

module.exports = Game;