import {_game} from "/catan/game.js";
import {_view} from "/catan/view.js";
import * as _hex from "/catan/hex.js";

const app = new PIXI.Application({
    width: 600, height: 600, backgroundColor: 0x000000, backgroundAlpha: 0.5, antialias: true
});

var stadt_=false;
var spieler_=0;
var position=[];
var size=50;

app.view.id = "pixijs";

var map=document.getElementById('map');
map.appendChild(app.view);

var game = new _game();
var view = new _view(game, app.screen.width, app.screen.height);

function redraw(){
    app.stage.removeChild(view);
    view = new _view(game, app.screen.width, app.screen.height);
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
    view.marked_tiles = [];
});

document.getElementById('loeschen').addEventListener('click', e => {
    game.wege_bauen = new Map();
    game.kreuzungen_bauen = new Map();
    view.marked_tiles = [];
});

document.getElementById('stadt').addEventListener('click', e => {
    document.getElementById('stadt').innerText=stadt_?'Siedlung':'Stadt';
    view.marked_tiles = [];
    stadt_=!stadt_;
    redraw();
});

document.getElementById('spieler').addEventListener('click', e => {
    view.marked_tiles = [];
    spieler_++;
    spieler_=spieler_%4;
    document.getElementById('spieler').innerText=spieler_;
    redraw()
});

function buildMarkedTiles(){
    if(_hex.areNeighbours(view_.marked_tiles))
    switch(view_.marked_tiles.length){
        case 2:
            if(isFree(marked_tiles)){
                game.wege_bauen.set(view.marked_tiles, {id: spieler_});
                redraw();
                view.marked_tiles = [];
            }
            else
            temp_graphics.clear();
            break;
        case 3:
            if(isFree(marked_tiles)){
                game.kreuzungen_bauen.set(marked_tiles, {id: spieler_, stadt: stadt_});
                redraw();
                view.marked_tiles = [];
            }
            else
            temp_graphics.clear();
            break;
    }
}