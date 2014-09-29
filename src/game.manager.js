var EventEmitter = require('events').EventEmitter;
var util = require('util');

function GameManager() {
    this.games = [];
}

util.inherits(GameManager, EventEmitter);

GameManager.prototype.watch = function (game) {
    var self = this;
    this.games.push(game);
    this.emit('watched', game);

    game.on('ended', function () {
        self.emit('ended', game);
        self.unwatch(game);
    });
};

GameManager.prototype.unwatch = function (game) {
    for (var i = 0, l = this.games.length; i < l; i++) {
        if (this.games.room === game.room) {
            this.games.splice(i, 1);
            this.emit('unwatched', game);
            break;
        }
    }
};

GameManager.prototype.count = function () {
    return this.games.length;
};

module.exports = GameManager;