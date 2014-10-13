window.Game = (function ($, EventEmitter) {
    function Game(socket, gender, opt) {
        this.gtime = 30;
        this.qtime = null;

        this.socket = socket;
        this.gender = gender;

        this.medias = [];

        this.users = [];

        this.opt = $.extend({
            timeout: 30 * 1000 // 1 minute
        }, opt);

        this.role = null;
        this.name = null;

        init.call(this);
    }

    Game.roles = roles;

    Game.reasons = reasons;

    util.inherits(Game, EventEmitter);

    function init() {
        var self = this;

        this.socket.emit('gender', this.gender);
        this.socket.on('game.role', function (data) {
            self.name = data.name;
            self.socket.id = data.id;
            self.role = data.role;
            self.users = data.users;
            self.emit('role', data.role);

            self.emit('start');
            start.call(self);
            self.emit('started');
        });
    }

    function QuestionTimer(){
        var self = this;
        if (this.qtime == undefined || isNaN(this.qtime)) {
            this.qtime = 15;
        }

        self.emit('disabledChat', this.qtime);

        if (this.qtime == 0) {
            this.qtime = undefined;
            self.emit('enabelChat');
        }else{
            setTimeout(function(){QuestionTimer.call(self)},1000);
        }
        this.qtime--;
    }

    function GlobalTimer() {
        var self = this;
        self.emit('setGtime', this.gtime);

        if (this.gtime == 0) {
            this.gtime = undefined;
            if (this.role == Game.roles.seeker) {
                self.emit('vote', this.users);
            }
        }else{
            setTimeout(function(){GlobalTimer.call(self)},1000);
        }
        this.gtime--;
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
            self.emit('message', e, e.data.author, e.data.ms);
        };

        this.connection.onstream = function (e) {
            var media = e.mediaElement;


            if (e.type == 'local') {
                media.muted = true;
                self.emit('stream', e, media, e.type);
            }else{
                self.medias.push(media);
                if(self.role !== Game.roles.seeker){
                    self.emit('stream', e, media, e.type);
                }else{
                    media.muted = true;
                }
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
        GlobalTimer.call(self);

        this.socket.on('game.over', function (data) {
            self.emit('game.over',data);
        });
        this.socket.on('game.result', function (data) {
            self.emit('game.result', data);
        });
    }


    Game.prototype.message = function (message) {
        var self = this;

        this.connection.send({author:this.name, ms:message});

        QuestionTimer.call(self);
    };
    Game.prototype.vote = function (vote) {
        this.socket.emit('game.vote', vote);
    };
    Game.prototype.end = function () {
    };

    return Game;
})(jQuery, window.EventEmitter);