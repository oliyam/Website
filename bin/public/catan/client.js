import {_game} from "/catan/game.js";
import {_view} from "/catan/view.js";
import * as _hex from "/catan/hex.js";

const app = new PIXI.Application({
    width: 600, height: 600, backgroundColor: 0x000000, backgroundAlpha: 0.5, antialias: true
});


app.view.id = "pixijs";

var game = new _game();
var view = new _view(game, app.screen.width, app.screen.height);

var map=document.getElementById('map');
map.appendChild(app.view);

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
    view.temp.marked_tiles = [];
});

document.getElementById('loeschen').addEventListener('click', e => {
    game.wege_bauen = new Map();
    game.kreuzungen_bauen = new Map();
    view.temp.marked_tiles = [];
});

document.getElementById('stadt').addEventListener('click', e => {
    document.getElementById('stadt').innerText=stadt?'Siedlung':'Stadt';
    view.temp.marked_tiles = [];
    view.temp.stadt=!view.temp.stadt;
    redraw();
});

document.getElementById('spieler').addEventListener('click', e => {
    view.temp.marked_tiles = [];
    view.temp.spieler=++view.temp.spieler%4;
    document.getElementById('spieler').innerText=view.temp.spieler;
    redraw()
});

function buildMarkedTiles(){
    if(_hex.areNeighbours(view.temp.marked_tiles))
    switch(view.temp.marked_tiles.length){
        case 2:
            if(isFree(marked_tiles)){
                game.wege_bauen.set(view.temp.marked_tiles, {id: view.temp.spieler});
                redraw();
                remp.marked_tiles = [];
            }
            else
            temp_graphics.clear();
            break;
        case 3:
            if(isFree(marked_tiles)){
                game.kreuzungen_bauen.set(view.temp.marked_tiles, {id: view.temp.spieler, stadt: stadt_});
                redraw();
                view.temp.marked_tiles = [];
            }
            else
            temp_graphics.clear();
            break;
    }
}