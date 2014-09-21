//link question timer
var _qtimer;
//val question timer(sec)
var qtime = 15;

//link global timer
var _gtimer;
//val global time(sec)
var gtime = 30;

var socket;
var connection = new RTCMultiConnection();
/*
1 honest - честный
2 liar - лжец
3 seeker - искатель
*/
var role;

function connect() {
    console.log('connected');
    socket = io.connect('/');


	connection.session = {
		data: true,
		audio: true,
		video: true
	};


    socket.on('connect',function() {
      console.log('Client has connected to the server!');
      socket.emit('setSex',{sex: $('input:radio[name=sex]:checked').val()});
    });

    

    socket.on('test',function(data){console.log(data.ms);});

    socket.on('webrtc.open', function (data) {
    	console.log('open');
    	connection.open(data.roomId);
		socket.emit('webrtc.ready');
	});
	socket.on('webrtc.connect', function (data){
    	console.log('rtc connect');
		connection.connect(data.roomId);
	});

};

function stop() {
    console.log();
};

function startGame() {
    gtimer = setInterval(function () {
        startGlobalTimer(function () {
            min = Math.floor(gtime / 60);
            sec = gtime - min * 60;
            sec = sec > 9 ? sec : '0' + sec;
            $('.gtimer').html(min + ':' + sec);
        }, endGame);
    }, 1000);
};

function endGame() {
    alert('end game');
}
/*
function startVideo(data) {
	connection.open(data.roomId);
	socket.emit('webrtc.ready');
}

function stopVideo() {

}
*/

connection.onstream = function(event) {
	// don't show remote video streams for host
	event.mediaElement.muted = true;
	$(event.mediaElement).appendTo($('.videos'));
};

function printMs(text, author, date, type) {
    if (type == undefined) {
        type = "left";
    }
    template = '<div class="ms ' + type + '">\
                    <div class="author">\
                         ' + author + '\
                    </div>\
                    <div class="text">\
                        ' + text + '\
                    </div>\
                </div>';

    $(".chatPole").append(template);

}

function sendMs(data) {
    printMs(data, "Я", "дата", "my");
    $("#chatInput").val("");
    _qtimer = setInterval(function () {
        startQuestionTimer(disabledChat, enabledChat)
    }, 1000);

}
/*
    regular - метод вызывающейсяна при каждом прохождении
    end - метод вызывающейся при завершении таймера
*/
function startQuestionTimer(regular, end) {
    if (qtime == undefined || isNaN(qtime)) {
        qtime = 15;
    }
    regular();

    if (qtime == 0) {
        qtime = undefined;
        console.log(qtime);
        clearInterval(_qtimer);
        end();
    }
    qtime--;
}

/*
    regular - метод вызывающейсяна каждую секундуиры
    end - метод вызывающейся при завершении таймера
*/
function startGlobalTimer(regular, end) {
    if (gtime == undefined) {
        gtime = 300;
    }
    regular();

    if (gtime == 0) {
        gtime = undefined;
        clearInterval(_gtimer);
        end();
    }
    gtime--;
}

function disabledChat() {
    $("#send").attr("disabled", "disabled");
    $("#send").html(qtime);
}

function enabledChat() {
    $("#send").removeAttr("disabled");
    $("#send").html("send");
}
