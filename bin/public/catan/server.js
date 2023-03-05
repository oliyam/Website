const { StrictEventEmitter } = require('socket.io/dist/typed-events');
const server=require('../chat/server.js');
const catan=require('../catan/game.js');

exports.run = (io, channel, logger) => {

	function log(txt, color){
		logger(channel_name+' '+txt, color);
	}; 
    
    server.run(io, channel, logger);

    var players=[];

    var game=new catan.spiel();

    const channel_name=channel+'>';
    io.on('connection', socket => {

        socket.on(channel_name+'watch-request', () => {
            if(server.ioactive[socket.id])
                io.to(socket.id).emit(channel_name+'game-update', game.forPlayer(-1));
        });

        socket.on(channel_name+'turn', msg => {
            for(let entry of msg.wege)
                game.spielfeld.wege.set(entry[0], entry[1]);

            for(let entry of msg.kreuzungen)
                game.spielfeld.kreuzungen.set(entry[0], entry[1]);

            socket.broadcast.emit(channel_name+'game-update', game.forPlayer(-1));
            for(var i=0;i<players.length;i++)
                io.to(players[i]).emit(channel_name+'game-update', game.forPlayer(i));
        });

        socket.on(channel_name+'send-chat-msg', msg =>{
            //if socket is active
            if(server.ioactive[socket.id])
				if(msg[0].substring(0,"pls player".length)=="pls player"&&players.indexOf(socket.id)==-1&&players.length<4){
                    players.push(socket.id)
                    logger((socket.id)+" selected player-"+(players.length-1)+"!", "yellow")
                    
                    var current_players = [];
                    for(var i=0;i<players.length;i++)
                        current_players.push({player: i, user: server.users[players[i]]});
                    
                    socket.broadcast.emit(channel_name+'new-player', current_players);

                    var game_users={};
                    Object.keys(server.users).forEach((id) => {
                        game_users[id]=players.indexOf(id)!=-1?server.users[id]+"<player: "+players.indexOf(id)+'>':server.users[id];
                    });

                    io.to(socket.id).emit(channel_name+'get-users', {users: game_users, ids: server.ids});
                    socket.broadcast.emit(channel_name+'get-users', {users: game_users, ids: server.ids})

                    io.to(socket.id).emit(channel_name+'chat-msg', {msg: ["You, @"+server.users[socket.id]+", selected player-"+(players.length-1), ], name: "[Catan-server]"});
                    socket.broadcast.emit(channel_name+'chat-msg', {msg: ["User: @"+server.users[socket.id]+", selected player-"+(players.length-1), ], name: "[Catan-server]"});
                    
                    io.to(socket.id).emit(channel_name+'game-update', game.forPlayer(players.length-1));
                }
        });
    }); 
};

StrictEventEmitter.prototype.override = function(event, fn) {
    this.removeAllListeners(event);
    this.on(event, fn);
}