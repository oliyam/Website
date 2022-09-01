import {_game} from "/catan/game.js";
import {_view} from "/catan/view.js";
import * as _hex from "/catan/hex.js";

/*const socket=io("51e3-178-115-41-230.ngrok.io");

var name=prompt("pls name");
var validName=false;
var users=[];
var message="What's your name?";

// Namensanfrage
socket.emit('catan-name-request', name);

// Rückmeldung Namensanfrage
socket.on('catan-name-valid', valid => {
	if(valid)
		console.log("You joined!");
	else
		socket.emit('catan-name-request', prompt("name already taken or invalid"));
})

// Weiterleitung zu /dead bei einer toten Sitzung
socket.on('catan-session-dead', id => {
	console.log("Session for Socket: "+id+", is no longer alive");
	location.href="/dead";
})
*/
var temp = {
    graphics: new PIXI.Graphics(),
    stadt: false,
    spieler: 0,
    marked_tiles: [],
    kreuzungen: new Map(),
    wege: new Map()
}

const app = new PIXI.Application({
    width: 600, height: 600, backgroundColor: 0x000000, backgroundAlpha: 0.5, antialias: true
});
app.view.id = "pixijs";

var size=50;

var game = new _game();
var view = new _view(game, temp, app.screen.width, app.screen.height, size);

var map=document.getElementById('map');
map.appendChild(app.view);
app.stage.addChild(view);

function redraw(){
    view.drawGame(game, temp, app.screen.width, app.screen.height, size);
}

redraw();

let count = 0;
app.ticker.add(() => {
    count += 0.01;
});

map.addEventListener('wheel', e => {
    e.preventDefault();
    size += e.deltaY * -0.1;
    size = Math.min(Math.max(50, size), 100);
    redraw();
});

map.addEventListener('mouseover', e => {
    map.style.cursor = 'crosshair';
});

document.getElementById('zug_beenden').addEventListener('click', e => {
    buildMarkedTiles();
});

document.getElementById('bauen').addEventListener('click', e => {
    buildMarkedTiles();
});

document.getElementById('loeschen').addEventListener('click', e => {
    temp = {
        graphics: new PIXI.Graphics(),
        stadt: false,
        spieler: 0,
        marked_tiles: [],
        kreuzungen: new Map(),
        wege: new Map()
    }
    redraw();
});

document.getElementById('stadt').addEventListener('click', e => {
    document.getElementById('stadt').innerText=temp.stadt?'Siedlung':'Stadt';
    temp.marked_tiles = [];
    temp.stadt=!temp.stadt;
    redraw();
});

document.getElementById('spieler').addEventListener('click', e => {
    temp.marked_tiles = [];
    temp.spieler=(temp.spieler+1)%4;
    document.getElementById('spieler').innerText=temp.spieler;
    redraw();
});

function buildMarkedTiles(){
    if(_hex.areNeighbours(temp.marked_tiles)&&game.isFree(temp)){
        switch(temp.marked_tiles.length){
            case 2:
                temp.wege.set(temp.marked_tiles, {id: temp.spieler});
                break;
            case 3:
                temp.kreuzungen.set(temp.marked_tiles, {id: temp.spieler, stadt: temp.stadt});
                break;
        }
        temp.marked_tiles = [];
        redraw();
    }
}