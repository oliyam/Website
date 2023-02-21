
const { StrictEventEmitter } = require('socket.io/dist/typed-events');
const server=require('../chat/server.js');

exports.run = (io, channel, logger) => {

    server.run(io, channel, logger);

    players = new Array(4);

    const channel_name=channel+'>';
    io.on('connection', socket => {
        socket.on(channel_name+'send-chat-msg', msg =>{
            //if socket is active
            if(server.ioactive[socket.id])
				if(msg[0].substring(0,"player-".length)=="player-"&&msg[0].substring("player-".length,"player-".length+1)>=0&&msg[0].substring("player-".length,"player-".length+1)<4&&players[msg[0].substring("player-".length,"player-".length+1)]==undefined){
                    players[msg[0].substring("player-".length,"player-".length+1)]=socket.id;
                    logger(socket.id+" selected player-"+msg[0].substring("player-".length,"player-".length+1)+"!", "yellow")
                }
        });
    }); 
};

StrictEventEmitter.prototype.override = function(event, fn) {
    this.removeAllListeners(event);
    this.on(event, fn);
}