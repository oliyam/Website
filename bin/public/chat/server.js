exports.run = (server, log) => {
	
	const pwd="sportslorry";
	const io=require('socket.io')(server, {pingTimeout: 10000});

	//Liste mit allen Benutzernamen an den Stellen der socket-ids
	var users={};
	//Array mit allen socket-ids
	var ids=[];
	//Boolean Liste fur alle Aktiven Sockets
	var ioactive={};
	//Liste mit der Anzahl an name-requests an den Stellen der socket-ids
	var requests={};

	//wird ausgefuehrt wenn sich ein neuer socket zum server vebindet
	io.on('connection', socket => {	   
	 
		//wird ausgeführt wenn sich ein socket vom server trennt
		socket.on('disconnect', () => {
			delete ioactive[socket.id];
			delete requests[socket.id];
			delete users[socket.id];
			if(!(users[socket.id]===null||users[socket.id]=="null"||users[socket.id]===undefined)){
				socket.broadcast.emit('user-disconnect', users[socket.id]);
			}	
			ids=ids.filter(function(value,index,arr){return value!=socket.id;});
			socket.broadcast.emit('get-users', {users: users, ids: ids});
			log("disconnect: "+socket.id,"red");
		})
		socket.on('send-chat-msg', msg =>{
			//log
			if(msg[1]!==undefined)
				log(users[socket.id]+": "+msg[0]+"; "+msg[1],"magenta");
			else
				log(users[socket.id]+": "+msg[0]+"; <no image>","white");		
			//if socket is active
			if(ioactive[socket.id]){
				//adminmode
				if(msg[0].substring(0,"admin".length)=="admin"){
					log("adminmode for "+users[socket.id],"yellow");
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
								for(var i=0;i<ids.length;i++)
									if(users[ids[i]]==cmd[2]){
										log("got you!","green")
										ioactive[ids[i]]=false;
										log("kicked: "+users[ids[i]],"green");
									}	
								break;
						}
					}
					else
						log("denied!","red");
				}
				else if(ioactive[socket.id])
						socket.broadcast.emit('chat-msg', {msg: msg, name: users[socket.id]});
			}	
			else{
				io.to(socket.id).emit('session-dead', socket.id);
				socket.disconnect(true);
			}
		})	
		socket.on('name-request', name => {
			// Test validity of requested username
			function isValidName(n){
				return !(Object.values(users).indexOf(n)>-1||n==""||n===null||n===undefined||n.includes(" ")||n.charAt(n.length-1)==":"||n.length>200||n=="null"||n=="You"||n=="you"||n=="YOU"||n=="Admin"||n=="undefined"||n=="plsnull");
			}
			if(requests[socket.id]===undefined)	
				requests[socket.id]=0;
			else
				requests[socket.id]++;
			if(requests[socket.id]>=10){
				io.to(socket.id).emit('session-dead', socket.id);
				socket.disconnect(true);
			}
			if(users[socket.id]===undefined){
				var valid=isValidName(name);
				console.log("testing validity...");
				io.to(socket.id).emit('name-valid', valid);
				console.log("name request: "+name+"; valid: "+valid);
				if(valid){
					log("*************************************************************","green");
					ioactive[socket.id]=true;
					users[socket.id]=name;  
					ids.push(socket.id);
					io.to(socket.id).emit('get-users', {users: users, ids: ids});
					socket.broadcast.emit('get-users', {users: users, ids: ids});
					socket.broadcast.emit('user-connected', users[socket.id]);
					for(var i=0;i<ids.length;i++)
						log("socket: "+i+"; id: "+ids[i]+"; name: "+users[ids[i]]+"; active: "+ioactive[ids[i]],"green");
					log("*************************************************************","green");
				}
			}
		})
	})

}