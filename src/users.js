var EventEmitter = require('events').EventEmitter;
var util = require('util');

var shared = require('./../public/js/shared');

var GameError = require('./error');

function Users(options) {

    this.opt = util._extend({
        count: 3
    }, options);

    this.mans = [];
    this.womans = [];
}

util.inherits(Users, EventEmitter);

Users.genders = shared.genders;

function getList(gender) {
    if (gender == Users.genders.man) {
        return this.mans;
    } else if (gender == Users.genders.woman) {
        return this.womans;
    } else {
        throw new GameError("invalid gender", GameError.INVALID_GENDER);
    }
}

function remove(client, list) {
    for (var i = 0, l = list.length; i < l; i++) {
        if (list[i] === client.id) {
            list.splice(i, 1);
            break;
        }
    }
}

function random() {
    if (this.mans.length >= 1 && this.womans.length >= 1) {
        var rand = Math.round(Math.random());
        return rand === 0 ? this.mans.pop() : this.womans.pop();
    } else if (this.mans.length >= 1) {
        return this.mans.pop();
    } else if (this.womans.length >= 1) {
        return this.womans.pop();
    } else {
        return null; // Такого случая произойти не может
    }
}

Users.prototype.add = function (client, gender) {
    var list = getList.call(this, gender);

    var self = this;

    client.gender = gender;

    client.on('disconnect', function () {
        self.remove(client, gender);
        self.emit('left', client);
    });

    list.push(client);

    this.emit('add', client);

    if (this.isReady()) {
        this.emit('ready');
    }
};

Users.prototype.isReady = function () {
    return this.mans.length >= 1 + this.womans.length >= 1 && (this.mans + this.womans >= 3);
};

Users.prototype.get = function () {
    if (!this.isReady()) {
        return null;
    }

    var man = this.mans.pop();
    var woman = this.womans.pop();
    var random = random.call(this);

    return {
        man: man,
        woman: woman,
        random: random
    }
};

Users.prototype.remove = function (client, gender) {
    if (gender && Users.genders[gender] !== undefined) {
        var list = getList.call(this, gender);
        remove.call(this, list);
    } else {
        remove.call(this, this.mans);
        remove.call(this, this.womans);
    }

    this.emit('removed', client, gender);
};

Users.prototype.count = function () {
    return this.mans.length + this.womans.length;
};

module.exports = Users;