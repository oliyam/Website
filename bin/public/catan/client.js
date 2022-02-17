import {_game} from "/catan/game.js";
import {_view} from "/catan/view.js";
import * as _hex from "/catan/hex.js";

var temp = {
    graphics: new PIXI.Graphics(),
    stadt: false,
    spieler: 0,
    marked_tiles: []
}

const app = new PIXI.Application({
    width: 600, height: 600, backgroundColor: 0x000000, backgroundAlpha: 0.5, antialias: true
});
app.view.id = "pixijs";

var game = new _game();
var view = new _view(game, temp, app.screen.width, app.screen.height);

var map=document.getElementById('map');
map.appendChild(app.view);

function redraw(){
    app.stage.removeChild(view);
    view = new _view(game, temp, app.screen.width, app.screen.height);
    view.drawGame();
    app.stage.addChild(view);
}

redraw();

let count = 0;
app.ticker.add(() => {
    count += 0.01;
});

map.addEventListener('mouseover', e => {
    map.style.cursor = 'crosshair';
});

document.getElementById('bauen').addEventListener('click', e => {
    buildMarkedTiles();
});

document.getElementById('loeschen').addEventListener('click', e => {
    game.wege_bauen = new Map();
    game.kreuzungen_bauen = new Map();
    temp.marked_tiles = [];
});

document.getElementById('stadt').addEventListener('click', e => {
    document.getElementById('stadt').innerText=stadt?'Siedlung':'Stadt';
    temp.marked_tiles = [];
    temp.stadt=!temp.stadt;
    redraw();
});

document.getElementById('spieler').addEventListener('click', e => {
    temp.marked_tiles = [];
    temp.spieler=(temp.spieler+1)%4;
    document.getElementById('spieler').innerText=temp.spieler;
    redraw()
});

function buildMarkedTiles(){
    if(_hex.areNeighbours(temp.marked_tiles))
    switch(temp.marked_tiles.length){
        case 2:
            if(game.isFree(temp.marked_tiles)){
                game.wege_bauen.set(view.temp.marked_tiles, {id: temp.spieler});
                temp.marked_tiles = [];
                redraw();
            }
            break;
        case 3:
            if(game.isFree(temp.marked_tiles)){
                game.kreuzungen_bauen.set(temp.marked_tiles, {id: temp.spieler, stadt: temp.stadt});
                temp.marked_tiles = [];
                redraw();
            }
            break;
    }
}