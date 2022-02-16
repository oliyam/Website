import {game} from "/catan/game.js";
import {view} from "/catan/view.js";
import * as _hex from "/catan/hex.js";

const app = new PIXI.Application({
    width: 600, height: 600, backgroundColor: 0x000000, backgroundAlpha: 0.5, antialias: true
});

var stadt_=false;
var spieler_=0;
var marked_tiles = [];
var position=[];
var size=50;

app.view.id = "pixijs";

var map=document.getElementById('map');
map.appendChild(app.view);

var game_ = new game();
var view_ = new view(game_, app.screen.width, app.screen.height);

function redraw(){
    app.stage.removeChild(view_);
    view_ = new view(game_, app.screen.width, app.screen.height);
    view_.drawGame();
    app.stage.addChild(view_);
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
    marked_tiles = [];
});

document.getElementById('loeschen').addEventListener('click', e => {
    game_.wege_bauen = new Map();
    game_.kreuzungen_bauen = new Map();
    marked_tiles = [];
});

document.getElementById('stadt').addEventListener('click', e => {
    document.getElementById('stadt').innerText=stadt_?'Siedlung':'Stadt';
    marked_tiles = [];
    stadt_=!stadt_;
    redraw();
});

document.getElementById('spieler').addEventListener('click', e => {
    marked_tiles = [];
    spieler_++;
    spieler_=spieler_%4;
    document.getElementById('spieler').innerText=spieler_;
    redraw()
});

function buildMarkedTiles(){
    if(_hex.areNeighbours(marked_tiles))
    switch(marked_tiles.length){
        case 2:
            if(isFree(marked_tiles)){
                game_.wege_bauen.set(marked_tiles, {id: spieler_});
                redraw();
                marked_tiles = [];
            }
            else
            temp_graphics.clear();
            break;
        case 3:
            if(isFree(marked_tiles)){
                game_.kreuzungen_bauen.set(marked_tiles, {id: spieler_, stadt: stadt_});
                redraw();
                marked_tiles = [];
            }
            else
            temp_graphics.clear();
            break;
    }
}

function has(array, tile){
    let a = false;
    array.forEach(t => {
        if(isEqual(t, tile))
            a = true;
    });
    return a;
}

//DONT USE RETURN IN FOR EACH

function connected(tiles){
    var connected = 0;
    game_.wege.forEach((value, keys) => {
        if(value.id==spieler_)
            switch(tiles.length){
                case 2:
                    if((_hex.areNeighbours([keys[0],tiles[0]])&&_hex.areNeighbours([keys[1],tiles[0]]))||(_hex.areNeighbours([keys[0],tiles[1]])&&_hex.areNeighbours([keys[1],tiles[1]])))
                        connected ++;
                    break;
                case 3:
                    if(
                        has(keys, tiles[0])&&has(keys, tiles[1])||
                        has(keys, tiles[1])&&has(keys, tiles[2])||
                        has(keys, tiles[2])&&has(keys, tiles[0])
                    )
                        connected ++;
                    break;
            }
    });
    game_.wege_bauen.forEach((value, keys) => {
        if(value.id==spieler_)
            switch(tiles.length){
                case 2:
                    if((_hex.areNeighbours([keys[0],tiles[0]])&&_hex.areNeighbours([keys[1],tiles[0]]))||(_hex.areNeighbours([keys[0],tiles[1]])&&_hex.areNeighbours([keys[1],tiles[1]])))
                        connected ++;
                    break;
                case 3:
                    if(
                        has(keys, tiles[0])&&has(keys, tiles[1])||
                        has(keys, tiles[1])&&has(keys, tiles[2])||
                        has(keys, tiles[2])&&has(keys, tiles[0])
                    )
                        connected ++;
                    break;
            }
    });
    return connected;
}

function spielerKreuzungen(spieler){
    let anzahl = 0;
    game_.kreuzungen_bauen.forEach((value, keys) => {
        anzahl+=value.id==spieler;
    });
    return anzahl;
}

function spielerStrassen(spieler){
    let anzahl = 0;
    game_.wege_bauen.forEach((value, keys) => {
        anzahl+=value.id==spieler;
    });
    return anzahl;
}

function areAllBlocked(tiles){
    var blocked=true;
    tiles.forEach(tile => {
        if(!game_.felder[tile.q+"/"+tile.r].blocked)
            blocked = false;
    });
    return blocked;
}

function isFree(tiles){
    let frei = true;
    if(spielerStrassen(spieler_)<2){
        if(tiles.length==3)
            frei = false;
        else if(tiles.length==2){

        }
    }
    else if(spielerStrassen(spieler_)==2){
        if(tiles.length==3){
            if(connected(tiles)!=1){
                frei = false;
            }
        }
        else{
            frei = false;
        }
    }
    if(spielerStrassen(spieler_)>=2&&spielerKreuzungen(spieler_)>=2)
        frei = true;

    if(tiles.length&&!areAllBlocked(tiles))
        switch(tiles.length){
            case 2:
                    game_.wege.forEach((value, key) => {
                        if(has(key, tiles[0])&&has(key, tiles[1]))
                            frei = false;
                    });
                    game_.wege_bauen.forEach((value, key) => {
                        if(has(key, tiles[0])&&has(key, tiles[1]))
                            frei = false;
                    });
                return frei;
            case 3:
                game_.kreuzungen.forEach((value, key) => {
                    if(
                        (
                            (has(key, tiles[0])&&has(key, tiles[1]))||
                            (has(key, tiles[1])&&has(key, tiles[2]))||
                            (has(key, tiles[2])&&has(key, tiles[0]))
                        )
                    )
                        frei = false;
                });
                game_.kreuzungen_bauen.forEach((value, key) => {
                    if(
                        (
                            (has(key, tiles[0])&&has(key, tiles[1]))||
                            (has(key, tiles[1])&&has(key, tiles[2]))||
                            (has(key, tiles[2])&&has(key, tiles[0]))
                        )
                    )
                        frei = false;
                });
                return frei;
        }
    return false;
}