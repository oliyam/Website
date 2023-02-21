import {spiel} from "/catan/game.js";
import {_view} from "/catan/view.js";
import * as _hex from "/catan/hex.js";

import * as channel from "/chat/channel.js";

channel.run("catan");

var temp = {
    stadt: false,
    spieler: 0,
    marked_tiles: [],
    kreuzungen: new Map(),
    wege: new Map()
}


var size=50;

var game = new spiel();
var spielfeld = game.spielfeld;
var view = new _view(spielfeld, temp, 600, 600, size);

view.addEventListener("mousemove", (e) => {

    view.mouse_x=e.clientX-view.getBoundingClientRect().left;
    view.mouse_y=e.clientY-view.getBoundingClientRect().top;
    redraw();
 });

 view.addEventListener("mousedown", (e) => {

    view.click=1;
    redraw();
 });

 view.addEventListener("mouseup", (e) => {
    view.click=0;
    redraw();
 });

 view.addEventListener("mouseout", (e) => {
    view.click=0;
    redraw();
 });

var map=document.getElementById('map');
map.appendChild(view);

function redraw(){
    var ressourcen=game.spieler[temp.spieler].ressourcen;
    var cost=calculateCost();

    console.log(cost)

    document.getElementById('holz').innerText=ressourcen.holz;
    document.getElementById('wolle').innerText=ressourcen.wolle;
    document.getElementById('lehm').innerText=ressourcen.lehm;
    document.getElementById('getreide').innerText=ressourcen.getreide;
    document.getElementById('erz').innerText=ressourcen.erz;
    
    document.getElementById('d-_holz').innerText='-'+cost.holz;
    document.getElementById('d-_wolle').innerText='-'+cost.wolle;
    document.getElementById('d-_lehm').innerText='-'+cost.lehm;
    document.getElementById('d-_getreide').innerText='-'+cost.getreide;
    document.getElementById('d-_erz').innerText='-'+cost.erz;

    document.getElementById('total_holz').innerText=ressourcen.holz-cost.holz;
    document.getElementById('total_wolle').innerText=ressourcen.wolle-cost.wolle;
    document.getElementById('total_lehm').innerText=ressourcen.lehm-cost.lehm;
    document.getElementById('total_getreide').innerText=ressourcen.getreide-cost.getreide;
    document.getElementById('total_erz').innerText=ressourcen.erz-cost.erz;

    document.getElementById('sp_label').innerText=game.spieler[temp.spieler].siegespunkte+"/10";
    document.getElementById('sp').value=game.spieler[temp.spieler].siegespunkte;
    document.getElementById('w6_0').src="/catan/res/wuerfel/wuerfelaugen-bs-"+game.wuerfel[0]+"-k.png";
    document.getElementById('w6_1').src="/catan/res/wuerfel/wuerfelaugen-bs-"+game.wuerfel[1]+"-k.png";

    view.drawGame(spielfeld, temp, 600, 600, size);

}

redraw();

let count = 0;


map.addEventListener('wheel', e => {
    e.preventDefault();
    size += e.deltaY * -0.1;
    size = Math.min(Math.max(30, size), 100);
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
        spieler: temp.spieler,
        marked_tiles: [],
        kreuzungen: new Map(),
        wege: new Map()
    }
    view.temp=temp;
    redraw();
});

document.getElementById('stadt').addEventListener('click', e => {
    document.getElementById('stadt').innerText=temp.stadt?'Siedlung':'Stadt';
    temp.stadt=!temp.stadt;
    redraw();
});

document.getElementById('spieler').addEventListener('click', e => {
    temp.spieler=(temp.spieler+1)%4;
    document.getElementById('spieler').innerText=temp.spieler;
    redraw();
});

document.getElementById('reset_map').addEventListener('click', e => {
    size=50;
    view.offset_x=0;
    view.offset_y=0;
    temp.marked_tiles = [];
    view.temp.marked_tiles = [];
    redraw();
});

function calculateCost(){
    var cost = {
        holz: 0,
        wolle: 0,
        lehm: 0,
        getreide: 0,
        erz: 0
    };

    temp.kreuzungen.forEach(bauwerk => {
        if(bauwerk.id==temp.spieler){
            if(bauwerk.stadt){
                cost.getreide+=2;
                cost.erz+=3;
            }
            else{
                cost.holz++;
                cost.lehm++;
                cost.getreide++;
                cost.wolle++;
            }
        }
    });

    temp.wege.forEach(strasse => {
        if(strasse.id==temp.spieler){
            cost.holz++;
            cost.lehm++;
        }

    });

    return cost;
}

function buildMarkedTiles(){
    if(_hex.areNeighbours(temp.marked_tiles)&&game.spielfeld.isFree(temp)){
        switch(temp.marked_tiles.length){
            case 2:
                temp.wege.set(temp.marked_tiles, {id: temp.spieler});
                break;
            case 3:
                temp.kreuzungen.set(temp.marked_tiles, {id: temp.spieler, stadt: temp.stadt});
                break;
        }
        temp.marked_tiles = [];
        view.temp.marked_tiles = [];
        redraw();
    }
}