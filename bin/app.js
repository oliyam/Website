console.log("NodeJS server is starting...");
/*
console.log("▓▓░░░░▓▓░░░░▓▓▓▓░░░░▓▓▓▓░░░░▓▓▓▓▓▓");
console.log("▓▓░░░░▓▓░░░░▓▓░░░░░░▓▓░░░░░░░░▓▓░░");
console.log("░▓▓▓▓▓▓░░░░░▓▓▓▓░░░░▓▓▓▓░░░░░░▓▓░░");
console.log("░░░▓▓░░░░░░░▓▓░░░░░░▓▓░░░░░░░░▓▓░░");
console.log("░░░▓▓░░░░░░░▓▓▓▓░░░░▓▓▓▓░░░░░░▓▓░░");
*/
//color log

const express=require('express'); 
const app=require('express')();
const http=require('http').createServer(app);
const jwt = require('jsonwebtoken')

const chat_server=require('./public/chat/server');

var PORT=3000;

var server=http.listen(PORT, listening);

const logger = require('node-color-log');

function log(string,color){
	logger.color(color);
	logger.log(string);
}

function listening(){	
	log("listening on port: "+PORT,"cyan");
}

app.use(express.static('public')); 
 
app.get('/', function (req, res) {
	res.sendFile(__dirname+"/public/index.html" );
}); 
 
app.get('/print/:string', function (req, res) {
	log(req.params.string, "yellow");
});

app.get('/login', function (req, res) {
	res.sendFile(__dirname+"/public/res/login.html" );
});

app.get('/chat', function (req, res) {
	res.sendFile(__dirname+"/public/res/chat.html" );
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

chat_server.run(server, log);