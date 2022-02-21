exports.run = (server, log) => {
	
	const io=require('socket.io')(server, {pingTimeout: 10000});

	log("Catan server running", "cyan");
	
	//Liste mit allen Benutzernamen an den Stellen der socket-ids
	var users={};
	//Array mit allen socket-ids
	var ids=[];
	//Boolean Liste fur alle Aktiven Sockets
	var ioactive={};
	//Liste mit der Anzahl an name-requests an den Stellen der socket-ids
	var requests={};

	io.on('catan-connection', socket => {	   
	 
		//wird ausgeführt wenn sich ein socket vom server trennt
		socket.on('catan-disconnect', () => {
			ids=ids.filter((value) => {return value!=socket.id;});
			if(!(users[socket.id]===null||users[socket.id]===undefined)){
				socket.broadcast.emit('user-disconnect', users[socket.id]);
				socket.broadcast.emit('get-users', {users: users, ids: ids});
				delete ioactive[socket.id];
				delete requests[socket.id];
				delete users[socket.id];
			}
			log("Catan - disconnect: "+socket.id,"red");
		})
		//wird ausgeführ wenn eine nachricht ankommt
		socket.on('catan-send-chat-msg', msg =>{
			//log
			if(msg[1]!==undefined)
				log("Catan - "+users[socket.id]+": "+msg[0]+"; "+msg[1],"magenta");
			else
				log(users[socket.id]+": "+msg[0]+"; <no image>","white");		
			//if socket is active
			if(ioactive[socket.id]){
				//adminmode
				if(msg[0].substring(0,"admin".length)=="admin"){
					log("Catan - "+"adminmode for "+users[socket.id],"yellow");
					var cmd=[];
					var last_index=0;
					for(var i=0;i<msg[0].length+1;i++)
						if(msg[0].charAt(i)==' '||i==msg[0].length){
							cmd.push(msg[0].substring(last_index,i));
							last_index=i+1;
						}
					log("Catan - "+"access:","yellow");						
					if(cmd[cmd.length-1]==pwd){
						log("Catan - "+"granted!","green");
						switch(cmd[1]){
							case "kick":
								log("Catan - "+"kicking: "+cmd[2]+"...","yellow");
								for(var i=0;i<ids.length;i++)
									if(users[ids[i]]==cmd[2]){
										log("Catan - "+"got you!","green")
										ioactive[ids[i]]=false;
										log("Catan - "+"kicked: "+users[ids[i]],"green");
									}	
								break;
						}
					}
					else
						log("Catan - "+"denied!","red");
				}
				else if(ioactive[socket.id])
						socket.broadcast.emit('catan-chat-msg', {msg: msg, name: users[socket.id]});
			}	
			else{
				io.to(socket.id).emit('catan-session-dead', socket.id);
				socket.disconnect(true);
			}
		})	
		//wird ausgeführ wenn ein socket einen namen anfragt
		socket.on('catan-name-request', name => {
			// Test validity of requested username
			function isValidName(n){
				return !(Object.values(users).indexOf(n)>-1||n==""||n===null||n===undefined||n.includes(" ")||n.charAt(n.length-1)==":"||n.length>200||n=="null"||n=="You"||n=="you"||n=="YOU"||n=="Admin"||n=="undefined"||n=="plsnull");
			}
			if(requests[socket.id]===undefined)	
				requests[socket.id]=1;
			else if(requests[socket.id]>10){
				io.to(socket.id).emit('catan-session-dead', socket.id);
				socket.disconnect(true);
			}
			else
				requests[socket.id]++;
			if(users[socket.id]===undefined){
				var valid=isValidName(name);
				console.log("Catan - "+"testing validity...");
				io.to(socket.id).emit('catan-name-valid', valid);
				console.log("Catan - "+"name request: "+name+"; valid: "+valid);
				if(valid){
					log("*************************************************************","green");
					ioactive[socket.id]=true;
					users[socket.id]=name;  
					ids.push(socket.id);
					io.to(socket.id).emit('catan-get-users', {users: users, ids: ids});
					socket.broadcast.emit('catan-get-users', {users: users, ids: ids});
					socket.broadcast.emit('catan-user-connected', users[socket.id]);
					for(var i=0;i<ids.length;i++)
						log("Catan - "+"socket: "+i+"; id: "+ids[i]+"; name: "+users[ids[i]]+"; active: "+ioactive[ids[i]],"green");
					log("*************************************************************","green");
				}
			}
		})
	})

}