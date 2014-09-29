(function (container) {
    container.roles = {
        seeker: 'seeker',
        liar: 'liar',
        honest: 'honest'
    };
    container.reasons = {
        clientDisconnect: 'client_leave_room',
        endedGame: 'game_ended'
    };
    container.genders = {
        man: 'man',
        woman: 'woman'
    };
})(typeof window !== 'undefined' ? window : module.exports);