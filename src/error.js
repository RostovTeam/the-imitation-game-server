var util = require('util');

function GameError() {
    Error.constructor.apply(this, arguments);
}

util.inherits(GameError, Error);


GameError.INVALID_GENRE = 100;

module.exports = GameError;
