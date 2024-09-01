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

    var trade_req = [];

    farben = [
        "FF0000",
        "0000FF",
        "FFFFFF",
        "FF8C00"
    ];

    var game = new catan.spiel();

    const channel_name = channel + '>';
    io.on('connection', socket => {

        function send_players(){
            var game_users = {};
            Object.keys(server.users).forEach((id) => {
                game_users[id] = typeof players[id] != 'undefined' ? (game.runde%4==players[id]?"<b style='color: green'>&gt; </b>":"") + "<a>" + server.users[id] + "</a> <a style='color:"+farben[players[id]]+"'>[player-" + players[id] + "]</a>" : "<a>" + server.users[id] + "</a> <a style='color:green;'>[spectator]</a>";
            });

            io.to(socket.id).emit(channel_name + 'get-players', { users: game_users, ids: server.ids });
            socket.broadcast.emit(channel_name + 'get-players', { users: game_users, ids: server.ids });
        }

        socket.on('disconnect', () => {
            delete players[socket.id];
            send_players();
        });

        socket.on(channel_name + 'request-players', () => {send_players()});

        socket.on(channel_name + 'get-users', () => {send_players()});

        socket.on(channel_name + 'watch-request', () => {
            send_players();
            if (server.ioactive[socket.id])
                io.to(socket.id).emit(channel_name + 'game-update', {game: game.forPlayer(-1), cast: false});
        });
/*
        socket.on(channel_name + 'turn', msg => {
            if (server.ioactive[socket.id]){
                    if(game.zug_beenden(msg, players[socket.id])==-1)
                        log("ILLEGAL MOVE - CHECK FOR HACKERS!")
            else{
				io.to(socket.id).emit(channel_name+'session-dead', socket.id);
				socket.disconnect(true);
			}
        });

*/

        function send_game_update(cast){
            socket.broadcast.emit(channel_name + 'game-update', {game: game.forPlayer(-1), cast: cast});
            Object.keys(players).forEach((id) => {
                io.to(id).emit(channel_name + 'game-update', {game: game.forPlayer(players[id]), cast: cast});
            });
        }

        socket.on(channel_name + 'ritter_ausspielen', msg => {
            if(game.ritter_ausspielen(players[socket.id], msg.ritter.opfer, msg.ritter.feld)!=-1);
                send_game_update(false);
        });        

        socket.on(channel_name + 'fortschritt_ausspielen', msg => {
            if(game.fortschritt_ausspielen(players[socket.id], msg.type, msg.res)!=-1);
                send_game_update(false);
        }); 

        socket.on(channel_name + 'cast', msg => {
            if(game.runde%4==players[socket.id]&&game.wuerfeln()!=-1)
                send_game_update(true);
        });

        socket.on(channel_name + 'trade_req_out', ([res, id]) => {
            if(game.check_res(players[socket.id], id, res)){
                trade_req[players[socket.id]]=[res, id];
                Object.entries(players).forEach(([rx_socket_id, player_id]) => {
                    if(player_id==id){
                        io.to(rx_socket_id).emit(channel_name + 'trade_req_in', [res, players[socket.id]]);   

                        io.to(socket.id).emit(channel_name + 'chat-msg', { msg: ["You, @" + server.users[socket.id] + ", sent a trade request to @" + server.users[rx_socket_id] + ">! REQ: " + JSON.stringify(res)], name: "[Catan-server]" });
                        socket.broadcast.emit(channel_name + 'chat-msg', { msg: ["User: @" + server.users[socket.id] + ", sent a trade request to @" + server.users[rx_socket_id] + ">! REQ: " + JSON.stringify(res)], name: "[Catan-server]" });
                        send_game_update(false);
                        }
                });      
            }
        });

        socket.on(channel_name + 'trade_ack', (initiator_id) => {
            if(trade_req[initiator_id]&&game.handeln(initiator_id, trade_req[initiator_id][1] , trade_req[initiator_id][0])!=-1)
                delete trade_req[initiator_id];
            send_game_update(false);
        });
        
        socket.on(channel_name + 'bauen', msg => {
            game.zug_bauen(msg, players[socket.id]);
            send_game_update(false);
        });

        socket.on(channel_name + 'turn', msg => {
            if (server.ioactive[socket.id]){
                io.to(socket.id).emit(channel_name + 'end-of-turn');
                socket.broadcast.emit(channel_name + 'end-of-turn');
                /*
                //Ineffizientes Timeout zur Spannungserhaltung
                setTimeout(function(){
                */
               
                    if(game.zug_beenden(msg, players[socket.id])==-1)
                        log("ILLEGAL MOVE - CHECK FOR HACKERS!")
                    
                    var runde=game.neue_runde();
                    log("*** "+runde.runde+". Runde! Spieler-"+runde.id+" am Zug. ***", "magenta");

                    send_players();

                    send_game_update(false);
                /*
                }, 2000);
                */
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

 <                  send_players();

                    io.to(socket.id).emit(channel_name + 'chat-msg', { msg: ["You, @" + server.users[socket.id] + ", selected <player-" + player + ">!"], name: "[Catan-server]" });
                    socket.broadcast.emit(channel_name + 'chat-msg', { msg: ["User: @" + server.users[socket.id] + ", selected <player-" + player + ">!"], name: "[Catan-server]" });

                    io.to(socket.id).emit(channel_name + 'game-update', {game: game.forPlayer(player), cast: false});
                }
        });
    });
};

StrictEventEmitter.prototype.override = function (event, fn) {
    this.removeAllListeners(event);
    this.on(event, fn);
}