window.Game = (function ($, EventEmitter) {
    function Game(socket, gender, opt) {
        this.socket = socket;
        this.gender = gender;

        this.medias = [];

        this.isLiar = null;

        this.opt = $.extend({
            timeout: 60 * 1000 // 1 minute
        }, opt);

        this.role = null;

        init.call(this);
    }

    Game.roles = roles;

    util.inherits(Game, EventEmitter);

    function init() {
        var self = this;

        this.socket.emit('gender', this.gender);
        this.socket.on('game.role', function (data) {
            self.socket.id = data.id;
            self.role = data.role;
            self.isLiar = data.liar;
            self.emit('role', data.role, data.liar);

            self.emit('start');
            start.call(self);
            self.emit('started');
        });
    }

    function start() {
        var self = this;

        this.connection = new RTCMultiConnection();
        this.connection.userid = this.socket.id;
        this.connection.session = {
            data: true,
            audio: true,
            video: true
        };

        this.connection.onmessage = function (e) {
            self.emit('message', e, e.userid, e.data);
        };

        this.connection.onstream = function (e) {
            var media = e.mediaElement;
            if (e.type == 'local') {
                if (self.role !== Game.roles.seeker) {
                    media.muted = true;
                    self.emit('stream', e, media, e.type);
                }
            } else {
                media.muted = true;
                media.pause();
                self.medias.push(media);
            }
        };

        this.socket.on('webrtc.channel.open', function (data) {
            self.connection.open(data.room);
            self.socket.emit('webrtc.channel.ready');
        });

        this.socket.on('webrtc.channel.connect', function (data) {
            self.connection.connect(data.room);
        });

        // TODO: Перенести на сторону сервера !
        if (this.role == Game.roles.seeker) {
            setTimeout(function () {
                self.emit('vote', self.isLiar);
            }, this.opt.timeout);
        }

        this.socket.on('game.over', function (data) {});
        this.socket.on('game.result', function (data) {
            self.emit('game.result', data);
        });
    }

    Game.prototype.message = function (message) {
        this.connection.send(message);
    };
    Game.prototype.vote = function (vote) {
        this.socket.emit('game.vote', {vote: vote});
    };
    Game.prototype.end = function () {
    };

    return Game;
})(jQuery, window.EventEmitter);