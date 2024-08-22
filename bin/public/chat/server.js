	//Liste mit allen Benutzernamen an den Stellen der socket-ids
	exports.users={};
	//Liste mit allen Kanalnamen an den Stellen der socket-ids
	exports.home={};
	//Array mit allen socket-ids
	exports.ids=[];
	//Boolean Liste fur alle Aktiven Sockets
	exports.ioactive={};
	//Liste mit der Anzahl an name-exports.requests an den Stellen der socket-ids
	exports.requests={};

exports.run = (io, channel, logger) => {

	const pwd=process.env.CHAT_SERVER_PWD;
	const channel_name=channel+'>';

	function log(txt, color){
		logger(channel_name+' '+txt, color);
	};

	io.engine.on("connection_error", err => {
		log("Socket.io connection error", "red")
	})

	log("Chat server running", "cyan");

	io.on('connection', socket => {

		//wird bei jedem Socket-Ereignis ausgeführt
		socket.onevent("*", () => {
            if (!server.ioactive[socket.id]){
                io.to(socket.id).emit(channel_name+'session-dead', socket.id);
                socket.disconnect(true);
            }
        });

		//wird ausgeführt wenn sich ein socket vom server trennt
		socket.on('disconnect', () => {
			if(!(exports.users[socket.id]===null||exports.users[socket.id]===undefined)&&exports.home[socket.id]==channel_name){
				exports.ids=exports.ids.filter((value) => {return value!=socket.id;});
				socket.broadcast.emit(channel_name+'user-disconnect', exports.users[socket.id]);
				socket.broadcast.emit(channel_name+'get-users', {users: exports.users, ids: exports.ids});
				delete exports.ioactive[socket.id];
				delete exports.requests[socket.id];
				delete exports.users[socket.id];
				delete exports.home[socket.id];
				log("disconnect: "+socket.id,"red");
			}
		})
		//wird ausgeführ wenn eine nachricht ankommt
		socket.on(channel_name+'send-chat-msg', msg =>{
			//log
			if(msg[1]!==undefined)
				log(exports.users[socket.id]+": "+msg[0]+"; "+msg[1],"magenta");
			else
				log(exports.users[socket.id]+": "+msg[0]+"; <no image>","white");		
			//if socket is active
			if(exports.ioactive[socket.id]){
				//adminmode
				if(msg[0].substring(0,"admin".length)=="admin"){
					log("adminmode for "+exports.users[socket.id],"yellow");
					var cmd=[];
					var last_index=0;
					for(var i=0;i<msg[0].length+1;i++)
						if(msg[0].charAt(i)==' '||i==msg[0].length){
							cmd.push(msg[0].substring(last_index,i));
							last_index=i+1;
						}
					log("access:","yellow");						
					if(cmd[cmd.length-1]==pwd){
						log("granted!","green");
						switch(cmd[1]){
							case "kick":
								log("kicking: "+cmd[2]+"...","yellow");
								for(var i=0;i<exports.ids.length;i++)
									if(exports.users[ids[i]]==cmd[2]){
										log("got you!","green")
										exports.ioactive[ids[i]]=false;
										log("kicked: "+exports.users[ids[i]],"green");
									}	
								break;
						}
					}
					elseS
						log("denied!","red");
				}
				else if(exports.ioactive[socket.id])
						socket.broadcast.emit(channel_name+'chat-msg', {msg: msg, name: exports.users[socket.id]});
			}	
			else{
				io.to(socket.id).emit(channel_name+'session-dead', socket.id);
				socket.disconnect(true);
			}
		})	
		//wird ausgeführt wenn ein socket einen namen anfragt
		socket.on(channel_name+'name-request', name => {
			// Test validity of requested username
			function isValidName(n){
				return !(Object.values(exports.users).indexOf(n)>-1||n==""||n===null||n===undefined||n.includes(" ")||n.charAt(n.length-1)==":"||n.length>200||n=="null"||n=="You"||n=="you"||n=="YOU"||n=="Admin"||n=="undefined"||n=="plsnull");
			}
			if(exports.requests[socket.id]===undefined)	
				exports.requests[socket.id]=1;
			else if(exports.requests[socket.id]>10){
				io.to(socket.id).emit(channel_name+'session-dead', socket.id);
				socket.disconnect(true);
			}
			else
				exports.requests[socket.id]++;
			if(exports.users[socket.id]===undefined){
				var valid=isValidName(name);
				log("testing validity...");
				io.to(socket.id).emit(channel_name+'name-valid', valid);
				log("name request: "+name+"; valid: "+valid);
				if(valid){
					log("*************************************************************","green");
					exports.ioactive[socket.id]=true;
					exports.users[socket.id]=name;  
					exports.home[socket.id]=channel_name;  
					exports.ids.push(socket.id);
					io.to(socket.id).emit(channel_name+'get-users', {users: exports.users, ids: exports.ids});
					socket.broadcast.emit(channel_name+'get-users', {users: exports.users, ids: exports.ids});
					socket.broadcast.emit(channel_name+'user-connected', exports.users[socket.id]);
					for(var i=0;i<exports.ids.length;i++)
						log("socket: "+i+"; id: "+exports.ids[i]+"; name: "+exports.users[exports.ids[i]]+"; active: "+exports.ioactive[exports.ids[i]],"green");
					log("*************************************************************","green");
				}
			}
		})
	})
}