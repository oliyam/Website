export {run} 

function run(socket, channel){

	const channel_name=channel+'>';

	const msgContainer=document.getElementById("msg-card");
	const msgForm=document.getElementById("send-container");
	const msgInput=document.getElementById("msg-input");
	const onlineUsers=document.getElementById("online");

	var URL_params=new URLSearchParams(window.location.search)

	//Automatische Namensanfrage via URL-Query (?name=[name])
	var name=URL_params.get('name')||prompt("pls name");
	var validName=false;
	var users=[];
	var message="What's your name?";

	//Namensanfrage
	socket.emit(channel_name+'name-request', name);

	// Rückmeldung Namensanfrage
	socket.on(channel_name+'name-valid', valid => {
		if(valid)
			appendJoinMsg("You joined!");
		else
			socket.emit(channel_name+'name-request', prompt("name already taken or invalid"));
	})

	// Weiterleitung zu /dead bei einer toten Sitzung
	socket.on(channel_name+'session-dead', id => {
		console.log("Session for Socket: "+id+", is no longer alive");
		location.href="/dead";
	})

	//Nachricht empfangen
	socket.on(channel_name+'chat-msg', data => {
		appendMsg(data.name+": "+data.msg[0]);
		if(data.msg[1]!==undefined)
			appendImg(data.msg[1]);
	})

	//Benutzer verbunden
	socket.on(channel_name+'user-connected', name => {
		appendJoinMsg(name+" connected!");
	})

	//Benutzer getrennt
	socket.on(channel_name+'user-disconnect', user => {
		appendLeaveMsg(user+" disconnected!");
	})

	//Benutzerliste aktualisieren
	socket.on(channel_name+'get-users',  data => {
		removeAllUsers();
		for(var t=0;t<data.ids.length;t++)
			appendUser(data.users[data.ids[t]],data.ids[t]);
	})

	async function getReddit(msg, send){
		var subreddit=msg.substring(4,msg.length);
		var string={};
		string[0]=msg;
		if(msg.substring(0,3)=="pls"){
				var response=await fetch('https://www.reddit.com/r/'+subreddit+'.json');
				if(response.ok){
					var json=await response.json();
					var post=Math.floor(Math.random()*json.data.children.length);
					string[1]=(JSON.stringify(json.data.children[post].data.url));
					string[1]=string[1].substring(1,string[1].length-1);
					string[0]=(JSON.stringify(json.data.children[post].data.title));
				}
					
		}
		send(string);
	}

	msgForm.addEventListener('submit', e => {
		e.preventDefault();
		var msg={};
		msg[0]=msgInput.value;
		var valid=false;
		
		if(msg[0].substring(0,9)=="pls clear")
			while(msgContainer.firstChild)
				msgContainer.removeChild(msgContainer.firstChild);
		else
			getReddit(msg[0], function(msg){							
				if(msg[0]!=null&&msg!=""){	
					for(var u=0;u<msg[0].length;u++){
						if(msg[0].charAt(u)!=" ")
							valid=true;
					}	
					if(valid){
						if(msg[1]!==undefined)
							appendOwnImg("You: "+msg[0], msg[1]);
						else
							appendOwnMsg("You: "+msg[0]);
						socket.emit(channel_name+'send-chat-msg', msg);
					}
				}
			});
		msgInput.value="";
	})

	/****************************************
	 *	Funktionen zur Manipulation der GUI	*
	****************************************/

	function appendUser(user, id) {
		const userElement=document.createElement("div");
		userElement.style="padding: 0px 0px 0px 20px";
		userElement.setAttribute("id",id);
		userElement.innerText=user;
		onlineUsers.append(userElement);
	}
	function removeAllUsers() {
		const userElement=document.createElement("h1");
		for(var r=0;r<onlineUsers.childNodes.length;r++){
			while(onlineUsers.firstChild){
					onlineUsers.removeChild(onlineUsers.firstChild);
			}
		}	
		userElement.style="padding: 10px 10px 10px 10px;";
		userElement.innerText="Online:";
		onlineUsers.append(userElement);
	}


	function appendMsg(msg) {
		const msgElement=document.createElement("div");
		msgElement.style="word-wrap: break-word;border:1px solid white;width:50%;border-radius: 0px 5px 5px;padding: 10px 10px 10px 10px;";
		if(msg.includes("@"+name))
			msgElement.style="background-color:rgba(255,122,0,0.3);word-wrap: break-word;border:1px solid white;width:50%;border-radius: 0px 5px 5px;padding: 10px 10px 10px 10px;";
		msgElement.innerText=msg;
		msgContainer.append(msgElement);
		msgContainer.scrollTop=msgContainer.scrollHeight;
	}

	function appendLeaveMsg(msg) {
		const msgElement=document.createElement("div");
		msgElement.style="word-wrap: break-word;background-color:rgba(255,0,0,0.3);border:1px solid white;width:50%;border-radius: 0px 5px 5px;padding: 10px 10px 10px 10px;";
		msgElement.innerText=msg;
		msgContainer.append(msgElement);
		msgContainer.scrollTop=msgContainer.scrollHeight;
	}

	function appendJoinMsg(msg) {
		const msgElement=document.createElement("div");
		msgElement.style="word-wrap: break-word;background-color:rgba(0,255,0,0.3);border:1px solid white;width:50%;border-radius: 0px 5px 5px;padding: 10px 10px 10px 10px;";
		msgElement.innerText=msg;
		msgContainer.append(msgElement);
		msgContainer.scrollTop=msgContainer.scrollHeight;
	}

	function appendImg(msg) {
		const msgElement=document.createElement("img");
		msgElement.setAttribute("src", msg);
		msgElement.setAttribute("onerror","this.style.display='none'");
		msgElement.setAttribute("style","word-wrap: break-word;width:10%;border:1px solid white;width:30%;border-radius: 0px 5px 5px;");
		msgContainer.append(msgElement);
		msgContainer.scrollTop=msgContainer.scrollHeight;
	}

	function appendOwnImg(msg, img) {
		const image=document.createElement("img");
		image.setAttribute("src", img);
		image.setAttribute("onerror","this.style.display='none'");
		image.setAttribute("style","width:10%;right:0");
		image.style="word-wrap: break-word;background-color:rgba(255,255,255,0.3);text-align:right;border:1px solid white;width:30%;border-radius: 5px 0px 5px 5px;";

		const msgElement=document.createElement("div");
		msgElement.style="word-wrap: break-word;border:1px solid white;width:50%;border-radius: 0px 5px 5px;padding: 10px 10px 10px 10px;";
		if(msg.includes("@"+name))
			msgElement.style="background-color:rgba(255,122,0,0.3);word-wrap: break-word;border:1px solid white;width:50%;border-radius: 0px 5px 5px;padding: 10px 10px 10px 10px;";
		msgElement.innerText=msg;

		msgElement.append(image);
		msgContainer.append(msgElement);

		msgContainer.scrollTop=msgContainer.scrollHeight;
	}

	function appendOwnMsg(msg) {
		const msgElement=document.createElement("div");
		msgElement.innerText=msg;
		msgElement.style="word-wrap:break-word;background-color:rgba(255,255,255,0.3);text-align:right;border:1px solid white;width:50%;overflow:hidden;border-radius: 5px 0px 5px 5px;padding: 10px 10px 10px 10px;";
		if(msg.includes("@"+name))
			msgElement.style="background-color:rgba(255,122,0,0.3);word-wrap:break-word;text-align:right;border:1px solid white;width:50%;overflow:hidden;border-radius: 5px 0px 5px 5px;padding: 10px 10px 10px 10px;";
		msgContainer.append(msgElement);
		msgContainer.scrollTop=msgContainer.scrollHeight;
	}
};

