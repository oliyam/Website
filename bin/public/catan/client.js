import * as _hex from "../catan/hex_client.js"
import {spiel} from "/catan/game_client.js";
import {_view} from "/catan/view.js";
import * as c from "/chat/channel.js";
import {uncover} from "/preloader/preloader.js";

var temp = {
    last_ressourcen: {
        holz: 0,
        wolle: 0,
        lehm: 0,
        getreide: 0,
        erz: 0
    },
    stadt: false,
    spieler: 0,
    marked_tiles: [],
    kreuzungen: new Map(),
    wege: new Map()
}

var size=50;

var game;
var view = new _view(game, temp, 600, 600, size);

const event = new Event("uncover", {index: '-1'});
var map=document.getElementById('map');
map.appendChild(view);

const channel_name='catan'+'>';

const socket=new io();
c.run(socket, 'catan');

socket.emit(channel_name+'watch-request', {});

socket.on(channel_name+'game-update', msg => {
    game=new spiel()
    game.set(msg);
    redraw();
});

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

function redraw(){

    start = performance.now();
    render = true;

    if(game){   
        uncover('-1');

        if(typeof game.spieler !== 'undefined' && typeof game.spieler.ressourcen !== 'undefined')
        {
            uncover('-2');

            var ressourcen=game.spieler.ressourcen;
            var cost=calculateCost();
            var ertrag=dRessourcen();

            document.getElementById('total_holz').innerText=ressourcen.holz-cost.holz;
            document.getElementById('total_wolle').innerText=ressourcen.wolle-cost.wolle;
            document.getElementById('total_lehm').innerText=ressourcen.lehm-cost.lehm;
            document.getElementById('total_getreide').innerText=ressourcen.getreide-cost.getreide;
            document.getElementById('total_erz').innerText=ressourcen.erz-cost.erz;

            document.getElementById('total_holz').style=ressourcen.holz-cost.holz>=0?"color:white":"color:red";
            document.getElementById('total_wolle').style=ressourcen.wolle-cost.wolle>=0?"color:white":"color:red";
            document.getElementById('total_lehm').style=ressourcen.lehm-cost.lehm>=0?"color:white":"color:red";
            document.getElementById('total_getreide').style=ressourcen.getreide-cost.getreide>=0?"color:white":"color:red";
            document.getElementById('total_erz').style=ressourcen.erz-cost.erz>=0?"color:white":"color:red";

            document.getElementById('holz').innerText=ressourcen.holz;
            document.getElementById('wolle').innerText=ressourcen.wolle;
            document.getElementById('lehm').innerText=ressourcen.lehm;
            document.getElementById('getreide').innerText=ressourcen.getreide;
            document.getElementById('erz').innerText=ressourcen.erz;
            
            document.getElementById('d+_holz').innerText='+'+ertrag.holz;
            document.getElementById('d+_wolle').innerText='+'+ertrag.wolle;
            document.getElementById('d+_lehm').innerText='+'+ertrag.lehm;
            document.getElementById('d+_getreide').innerText='+'+ertrag.getreide;
            document.getElementById('d+_erz').innerText='+'+ertrag.erz;

            document.getElementById('d-_holz').innerText='-'+cost.holz;
            document.getElementById('d-_wolle').innerText='-'+cost.wolle;
            document.getElementById('d-_lehm').innerText='-'+cost.lehm;
            document.getElementById('d-_getreide').innerText='-'+cost.getreide;
            document.getElementById('d-_erz').innerText='-'+cost.erz;

            document.getElementById('sp_label').innerText=game.spieler.siegespunkte+"/10";
            document.getElementById('sp').value=game.spieler.siegespunkte;
            document.getElementById('w6_0').src="/catan/res/wuerfel/wuerfelaugen-bs-"+game.wuerfel[0]+"-k.png";
            document.getElementById('w6_1').src="/catan/res/wuerfel/wuerfelaugen-bs-"+game.wuerfel[1]+"-k.png";
        }

        view.drawGame(game, temp, 600, 600, size);
    }

    end = performance.now();
}

    var fps_ticks=0,render=false, start=0, end=0, interval=500, mul=1;

    window.setInterval(function(){
        if(render){
            document.getElementById('fps-box').style="color:black;";
            document.getElementById('fps-box').innerText="Render duration: "+(end - start)+"ms (FPS: "+1000.0/(end - start)+")";
            end = performance.now();
        }
        else{
            document.getElementById('fps-box').style="color:red;";
            document.getElementById('fps-box').innerText="No updates, render stopped! (FPS: <"+1000.0/interval*mul+")";
        }
        if(fps_ticks++%mul==0)
            render = false;
    }, interval);

    redraw();

    map.addEventListener('wheel', e => {
        e.preventDefault();
        size += e.deltaY * -0.1;
        size = Math.min(Math.max(100/((game.spielfeld.karte.length/2-1)||3), size), 100);
        redraw();
    });

    map.addEventListener('mouseover', e => {
        map.style.cursor = 'crosshair';
    });

    document.getElementById('zug_beenden').addEventListener('click', e => {
        buildMarkedTiles();
        socket.emit(channel_name+'turn', {player: temp.spieler, wege: [...temp.wege], kreuzungen: [...temp.kreuzungen]});
        temp = {
            last_ressourcen: {
                holz: 0,
                wolle: 0,
                lehm: 0,
                getreide: 0,
                erz: 0
            },
            stadt: false,
            spieler: temp.spieler,
            marked_tiles: [],
            kreuzungen: new Map(),
            wege: new Map()
        }
        view.temp=temp;
    });

    document.getElementById('bauen').addEventListener('click', e => {
        buildMarkedTiles();
    });

    document.getElementById('loeschen').addEventListener('click', e => {
        temp = {
            last_ressourcen: {
                holz: 0,
                wolle: 0,
                lehm: 0,
                getreide: 0,
                erz: 0
            },
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

    function dRessourcen(){
        var d_ressourcen={};
        for(var key in game.spieler.ressourcen)
            d_ressourcen[key]=game.spieler.ressourcen[key]-temp.last_ressourcen[key];

        return d_ressourcen;
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