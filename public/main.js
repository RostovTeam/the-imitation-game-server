var gender;

var $gender = $('#gender');
var $start = $('#start');
var $state = $('#state');
var $logger = $('#interlogger');
var $notice = $state.add($logger);

var messenger = {
    $text: $('#text_message'),
    $btn: $('#send_message'),
    $chat: $('#chat'),
    text: function () {
        return this.$text.val();
    },
    prepare: function (name, message) {
        return $('<div/>').text(name + ': ' + message);
    },
    message: function (name, message) {
        this.$chat.append(this.prepare(name, message));
    },
    onsend: function (cb) {
        this.$btn.click(cb);
    }
};

var $video = $('#video');

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

$start.click(function () {
    $(this).hide();

    $notice.html('Ожидание других игроков...');

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
            $logger.html('Ваша задача: Угадать. Мы знаем кто из игроков мужчина, а кто - женщина, а у вас на разгадку есть 5 минут. Задавайте игрокам вопросы, думайте, вычисляйте, догадывайтесь. Удачи!');
        } else if (role === Game.roles.liar) {
            $logger.html('Ваша задача: Имитировать. Отвечать так, как-будто вы - женщина(/мужчина). Ваши ответы должны убедить угадывающего, что именно вы говорите правду, а ваш оппонент лжет.');
        } else if (role === Game.roles.honest) {
            $logger.html('Ваша задача: Истина. Вам нужно убедить угадывающего, что вы действительно мужчина(/женщина). Ваш оппонент будет лгать, стараясь доказать обратное. Не дайте ему это сделать, докажите свою правоту!');
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

    game.on('vote', function (isLiar) {
        game.vote(!!confirm(isLiar + ' лжец?'));
    });

    game.on('stream', function (e, media, type) {
        media.style.width = '360px';
        media.style.height = '200px';

        $video.append(media);
    });

    game.on('message', function (e, userid, message) {
        messenger.message(userid, message);
    });

    messenger.onsend(function () {
        var message = messenger.text();
        message = message ? message : ' ';

        messenger.message('Я', message);
        game.message(message);
    });
});