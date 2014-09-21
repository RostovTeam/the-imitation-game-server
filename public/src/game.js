(function ($, EventEmitter) {
    function Game(socket, gender, opt) {
        this.socket = socket;
        this.gender = gender;

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
            self.role = data.role;
            self.isLiar = data.isLiar;
            self.emit('role', data.role, data.isLiar);

            self.emit('start');
            start.call(this);
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
            self.emit('stream', e, e.mediaElement, e.type);
        };

        this.socket.on('webrtc.multiconnection.open', function (data) {
            self.connection.open(data.room);
            self.socket.emit('webrtc.multiconnection.ready');
        });

        this.socket.on('webrtc.multiconnection.connect', function (data) {
            self.connection.connect(data.room);
        });

        if (this.role == Game.roles.seeker) {
            setTimeout(function () {
                self.emit('vote', self.isLiar);
            }, this.opt.timeout);
        }

        this.socket.on('game.over', function (data) {});
    }

    Game.prototype.message = function (message) {
        this.connection.send(message);
    };
    Game.prototype.vote = function (vote) {
        this.socket.emit('game.vote', {vote: vote});
    };
    Game.prototype.end = function () {

    };
})(jQuery, window.EventEmitter);