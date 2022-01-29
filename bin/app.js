console.log("NodeJS server is starting...");

//general dependencies
const express = require('express'); 
const app = require('express')();
const https = require('https');
const http = require('http').createServer(app);
const dotenv = require('dotenv').config();
const ngrok = require('ngrok');

//custom color logger
const log = require('./public/logger/color-logger.js').log;

//authentication
const users = require('./public/auth/users');
const auth = require('./public/auth/router');

//chatserver
const chat_server=require('./public/chat/server');

//start http server
var PORT= process.env.PORT || 80;
var server=http.listen(PORT, function(){
	log("HTTP server listening on port: ","cyan");
	log(PORT,"yellow");
});

//start ngrok
ngrok.connect({authtoken: process.env.NGROK_TOKEN, addr: PORT}).then( (url) => {
	log("Ngrok tunnel established: ", "magenta")
	log(url+" -> http://localhost:"+PORT, "yellow")
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
	res.sendFile(__dirname+"/public/catan/catan.html" );
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