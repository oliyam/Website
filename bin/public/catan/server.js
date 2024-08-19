const { StrictEventEmitter } = require('socket.io/dist/typed-events');
const server = require('../chat/server.js');
const catan = require('../catan/game.js');

exports.run = (io, channel, logger) => {

    function log(txt, color) {
        logger(channel_name + ' ' + txt, color);
    };

    server.run(io, channel, logger);

    //object with player numbers at player's socket id
    var players = {};

    var game = new catan.spiel();

    const channel_name = channel + '>';
    io.on('connection', socket => {

        socket.on('disconnect', () => {
            delete players[socket.id];
        });

        socket.on(channel_name + 'request-players', () => {
            var game_users = {};
            Object.keys(server.users).forEach((id) => {
                game_users[id] = typeof players[id] != 'undefined' ? "<a>" + server.users[id] + "</a> <a style='color:orange;'>[player-" + players[id] + ']</a>' : "<a>" + server.users[id] + "</a> <a style='color:green;'>[spectator]</a>";
            });

            io.to(socket.id).emit(channel_name + 'get-players', { users: game_users, ids: server.ids });
            socket.broadcast.emit(channel_name + 'get-players', { users: game_users, ids: server.ids });
        });

        socket.on(channel_name + 'watch-request', () => {
            if (server.ioactive[socket.id])
                io.to(socket.id).emit(channel_name + 'game-update', game.forPlayer(-1));
        });

        socket.on(channel_name + 'turn', msg => {
            if (server.ioactive[socket.id]){
                io.to(socket.id).emit(channel_name + 'end-of-turn');
                socket.broadcast.emit(channel_name + 'end-of-turn');
                //Ineffizientes Timeout zur Spannungserhaltung
                setTimeout(function(){
                    if(game.zug_beenden(msg, players[socket.id])==-1)
                        log("ILLEGAL MOVE - CHECK FOR HACKERS!")
                    
                    log("*** Neue Runde! Gewürfelte Zahl: " + game.neue_runde() + " ***", "magenta");

                    socket.broadcast.emit(channel_name + 'game-update', game.forPlayer(-1));
                    Object.keys(players).forEach((id) => {
                        io.to(id).emit(channel_name + 'game-update', game.forPlayer(players[id]));
                    });
                }, 2000);
            }
        });

        socket.on(channel_name + 'send-chat-msg', msg => {
            //if socket is active
            if (server.ioactive[socket.id])
                if (msg[0].substring(0, "pls player".length) == "pls player" && Object.keys(players).length < 4 && typeof players[socket.id] == 'undefined') {
                    var player;
                    for (var i = 3; i > -1; i--)
                        if (!Object.values(players).includes(i))
                            player = i;
                    players[socket.id] = player;
                    log("<socket.id:" + (socket.id) + "> selected <player-" + player + ">!", "yellow")

                    io.to(socket.id).emit(channel_name + 'get-users', { users: server.users, ids: server.ids });
                    socket.broadcast.emit(channel_name + 'get-users', { users: server.users, ids: server.ids });

                    io.to(socket.id).emit(channel_name + 'chat-msg', { msg: ["You, @" + server.users[socket.id] + ", selected <player-" + player + ">!"], name: "[Catan-server]" });
                    socket.broadcast.emit(channel_name + 'chat-msg', { msg: ["User: @" + server.users[socket.id] + ", selected <player-" + player + ">!"], name: "[Catan-server]" });

                    io.to(socket.id).emit(channel_name + 'game-update', game.forPlayer(player));
                }
        });
    });
};

StrictEventEmitter.prototype.override = function (event, fn) {
    this.removeAllListeners(event);
    this.on(event, fn);
}