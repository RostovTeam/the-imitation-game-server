window.User = (function () {
    function User(socket, gender) {
        var self = this;
        this.gender = gender;
        socket.on('game.role', function (role) {
            self.role = role;
        });
    }
})();