var gender;

var $gender = $('#gender');
var $start = $('#start');
var $logger = $('#interlogger');
var $gtimer = $('.gtimer');
var $ifseeker = $('.ifseeker');
var $vote = $('#vote');
var $btn_send = $('#send');
var $suggest = $('#suggest');
var $heightVideo = 0;

var questions = ['Какой у тебя размер груди?',
    'Опиши идеального парня',
    'Опиши идеальную девушку',
    'Что такое "карбюратор"?',
    'Что такое "френч"?',
    'Сколько жмешь от груди?',
    'Твой любимый футболист',
    'Где ты покупаешь одежду?',
    'Чем отличается эпиляция от депиляции?',
    'Если ваш рост 168 см, а вес 60 кг, то какой нужно покупать размер колготок?',
    'Что такое "брондирование"?',
    'Зачем сыпать соль когда варишь яйцо?',
    'Сколько было мужчин у главной героини "Секс в большом городе"?',
    'Разрушается ли каллоген при прыжках?',
    'Вредно ли колоть себе протеин?',
    'Сколько у тебя было парней?',
    'Во сколько лет вы собираетесь родить?',
    'На каком свидании уже можно заниматься сексом?',
    'Назовите виды женских трусов',
    'Какая у вас была самая экстремальная ситуация в жизни?',
    'Сексуальные извращения - вы за или против?',
    'Как часто вы видите член?'];

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
        this.$chat.scrollTop(this.$chat.get(0).scrollHeight);
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

var heightAll = function(){
    percentChat = 44;
    percentVideo = 32;

    $heightVideo = (self.innerHeight/100)*percentVideo;
    $heightChat = (self.innerHeight/100)*percentChat;

    messenger.$chat.height($heightChat);
};


var $video = $('.videos');

//переменные статистики
var $gameCounter = $('#game_count');
var $userCounter = $('#user_count');
var $allGameCounter = $('#all_game_count');

var game = null;


heightAll();

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

$suggest.click(function(){
    questions.sort(function() {
        return Math.random() - 0.6;
    });
    messenger.$text.val(questions[0]);
})

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
    game.on('role', function (role) {
        if (role === Game.roles.seeker) {
            $ifseeker.css('display','table-cell')
            $logger.html('Задача: Угадать.');//Мы знаем кто из игроков мужчина, а кто - женщина, а у вас на разгадку есть 5 минут. Задавайте игрокам вопросы, думайте, вычисляйте, догадывайтесь. Удачи!');
        } else if (role === Game.roles.liar) {
            $logger.html('Задача: Врать.');// Отвечать так, как-будто вы - женщина(/мужчина). Ваши ответы должны убедить угадывающего, что именно вы говорите правду, а ваш оппонент лжет.');
        } else if (role === Game.roles.honest) {
            $logger.html('Задача: Говорить правду.');// Вам нужно убедить угадывающего, что вы действительно мужчина(/женщина). Ваш оппонент будет лгать, стараясь доказать обратное. Не дайте ему это сделать, докажите свою правоту!');
        }
    });

    game.on('game.result', function (data) {
        var res = data.result;
        var message = res ?  'Не угадал': 'Угадал';

        if (game.role === Game.roles.seeker) {
            var medias = game.medias;
            for (var i = 0, l = medias.length; i < l; i++) {
                var media = medias[i];
                media.muted = false;
                media.volume = 1;
                media.play();
                media.className = "col-xs-4";
                media.style.height = $heightChat;

                $video.append(media);
            }
        }

        messenger.message('', message);
    });

    game.on('game.over', function (data) {console.log(data);
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
        media.style.height = $heightChat;

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