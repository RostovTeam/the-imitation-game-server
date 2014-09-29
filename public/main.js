var gender;

var $gender = $('#gender');
var $start = $('#start');
var $state = $('#state');
var $logger = $('#interlogger');
var $gtimer = $('.gtimer');
var $notice = $state.add($logger);
var $vote = $('#vote');
var $btn_send = $('#send');

var messenger = {
    $text: $('#text_message'),
    $chat: $('#chat'),
    clear: function(){
        this.$text.val("");
    },
    text: function () {
        return this.$text.val();
    },
    prepare: function (name, message) {
        if (name == "Я") {
            type = "my";
        }
        else{
            type = "";
        }
        template = '<div class="ms ' + type + '">\
                    <div class="author">\
                         ' + name + '\
                    </div>\
                    <div class="text">\
                        ' + message + '\
                    </div>\
                </div>';

        return template;
    },
    message: function (name, message) {
        this.$chat.append(this.prepare(name, message));
    },
    onsend: function (cb) {
        $btn_send.click(cb);
        this.$text.keypress(function( event ) {
            if ( event.which == 13 ) {
                cb();
            }
        })
    }
};


var $video = $('.videos');


//переменные статистики
var $gameCounter = $('#game_count');
var $userCounter = $('#user_count');
var $allGameCounter = $('#all_game_count');

var game = null;

$gender.change(function () {
    gender = $(this).val();

    $(this).hide();
    $start.show();
});

var socket = io.connect('/');

socket.on('test', function (data) {
    console.log('test', data);
});

$("#sendVote").click(function(){
        game.vote($("input[name=liar]").val());
        $('#myModal2').modal('toggle');
});

$start.click(function () {
    $(this).hide();

    $logger.html('Ожидание других игроков...');

    var socket = io.connect('/');

    socket.on('count.game', function (count) {
        $gameCounter.html(count)
    });
    socket.on('count.users', function (count) {
        $userCounter.html(count);
    });
    socket.on('count.allgame', function (count) {
        $allGameCounter.html(count);
    });

    game = new Game(socket, gender);
    game.on('role', function (role, isLiar) {
        if (role === Game.roles.seeker) {
            $logger.html('Задача: Угадать.');//Мы знаем кто из игроков мужчина, а кто - женщина, а у вас на разгадку есть 5 минут. Задавайте игрокам вопросы, думайте, вычисляйте, догадывайтесь. Удачи!');
        } else if (role === Game.roles.liar) {
            $logger.html('Задача: Врать.');// Отвечать так, как-будто вы - женщина(/мужчина). Ваши ответы должны убедить угадывающего, что именно вы говорите правду, а ваш оппонент лжет.');
        } else if (role === Game.roles.honest) {
            $logger.html('Задача: Говорить правду.');// Вам нужно убедить угадывающего, что вы действительно мужчина(/женщина). Ваш оппонент будет лгать, стараясь доказать обратное. Не дайте ему это сделать, докажите свою правоту!');
        }
    });

    game.on('game.result', function (data) {
        var res = data.result;
        var message = res ? 'Угадал' : 'Не угадал';

        if (game.role === Game.roles.seeker) {
            var medias = game.medias;
            for (var i = 0, l = medias.length; i < l; i++) {
                var media = medias[i];
                media.muted = false;
                media.volume = 1;
                media.play();
                media.className = "col-xs-4";
                $video.append(media);
            }
        }

        messenger.message('', message);
    });

    game.on('game.over', function (data) {
        var reason = data.reason;

        if (reason === Game.reasons.clientDisconnect) {
            return alert('Один из игроков покинул игры :(');
        }
    });

    game.on('enabelChat',function(){
        $btn_send.removeAttr("disabled");
        $btn_send.html("send");
    });

    game.on('disabledChat',function(time){
        $btn_send.attr("disabled", "disabled");
        $btn_send.html(time);
    });

    game.on('setGtime',function(time){
        var min = Math.floor(time / 60);
        var sec = time - min * 60;
        sec = sec > 9 ? sec : '0' + sec;

        $gtimer.html(min + ':' + sec);
    });



    game.on('vote', function (users) {
        for(var i=0; i<users.length; i++){
            template =  '<label class="radio-inline"> \
                          <input type="radio" name="liar" id="inlineRadio1" value="'+ users[i].id +'">'+ users[i].name +'\
                        </label>';
            $vote.append(template);
        }
        $('#myModal2').modal({
            backdrop: 'static',
            keyboard: false
        });

    });

    game.on('stream', function (e, media, type) {
        media.className = "col-xs-4";
        $video.append(media);
    });

    game.on('message', function (e, userid, message) {
        messenger.message(userid, message);
    });

    messenger.onsend(function () {
        if((game.qtime == undefined || isNaN(game.qtime ) && !message)) {
            var message = messenger.text();
            messenger.clear();
            //message = message ? message : ' ';
            messenger.message('Я', message);
            game.message(message);
        }
    });
});