console.log("NodeJS server is starting...");

//general dependencies
const express = require('express'); 
const app = require('express')();
const https = require('https');
const http = require('http').createServer(app);
const dotenv = require('dotenv').config();
const ngrok = require('ngrok');

//authentication
const users = require('./public/auth/users');
const auth = require('./public/auth/router.js');

//chatserver
const chat_server=require('./public/chat/server');

//color log
const logger = require('node-color-log');
function log(string,color){
	logger.color(color);
	logger.log(string);
}

//start http server
var PORT= process.env.PORT || 80;
var server=http.listen(PORT, function(){log("listening on port: "+PORT,"cyan");});

//start ngrok
ngrok.connect({auth: process.env.NGROK_TOKEN,PORT}).then( (url) => {
	log("Ngrok tunnel established: "+url+" -> http://localhost:"+PORT, "magenta")
	let user = new Buffer.alloc("oliyam:j3WKKYZnjY5C9yQAFGGyp6RePB87JS9cKjGPpv8xP9shsNtKWYVxPdqWCsygnY5s".length,"oliyam:j3WKKYZnjY5C9yQAFGGyp6RePB87JS9cKjGPpv8xP9shsNtKWYVxPdqWCsygnY5s").toString('base64');
	log(user, "yellow")
	https.request({
		hostname: 'dynupdate.no-ip.com',
		port: 80,
		path: '/nic/update?hostname=yameogo.ddns.net&myip='+url,
		Authorization: user,
		method: 'GET'}, res => {
			log(res.statusCode, "green")
	});
});
 
//start chat server
chat_server.run(server, log);

app.use(express.urlencoded({extended: true}));
app.use(express.json())
app.use(express.static('public')); 

app.get('/', function (req, res) {
	res.sendFile(__dirname+"/public/index.html" );
}); 

app.get('/print/:string', function (req, res) {
	log(req.params.string, "yellow");
});

app.get('/signup', function (req, res) {
	res.sendFile(__dirname+"/public/res/signup.html" );
});

app.post('/signup', auth);

app.get('/chat', function (req, res) {
	res.sendFile(__dirname+"/public/chat/chat.html" );
});
 
app.get('/catan', function (req, res) {
	res.sendFile(__dirname+"/public/res/underconstruction.html" );
});

app.get('/dead', function (req, res) {
	res.sendFile(__dirname+"/public/sessiondead.html" );
});

app.get('/snake', function (req, res) {
	res.sendFile(__dirname+"/public/res/snake.html" );
});
 
app.get('/sweep', function (req, res) {
	res.sendFile(__dirname+"/public/res/minesweeper.html" );
});

app.get('/rickroll', function (req, res) {
	res.sendFile(__dirname+"/public/rickroll.html" );
});

app.get('/animetiddies', function (req, res) {
	res.sendFile(__dirname+"/public/rickroll.html" );
});