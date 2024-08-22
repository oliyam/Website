import * as _hex from "../catan/hex_client.js"
import {spiel} from "/catan/game_client.js";
import {_view} from "/catan/view.js";
import * as c from "/chat/channel.js";
import {uncover} from "/preloader/preloader.js";

var temp = {

    stadt: false,
    spieler: 0,
    marked_tiles: [],
    kreuzungen: new Map(),
    wege: new Map(),
    entwicklungen: 0
};

var size=50;

var game=new spiel();
var view = new _view(game, temp, 600, 600, size);

var map=document.getElementById('map');
map.appendChild(view);

const channel_name='catan'+'>';

const socket=new io();
c.run(socket, 'catan');

var roll = new Audio('/catan/res/wuerfel/rolling dice 2.mp3');
var pop= new Audio('/catan/res/pop.mp3');
var one_up= new Audio('/catan/res/Purple Studs SFX.mp3');

function repeat_audio(audio, n){
    let count=1;
    audio.addEventListener('ended', function() {
        if(count<n){
            count++;
            this.play();
        }
    }, false);
    audio.play();
}

var URL_params=new URLSearchParams(window.location.search);

//Automatische Spieleranfrage via URL-Query (?player=1)
if(URL_params.get('player'))
    socket.emit(channel_name+'send-chat-msg', ["pls player", "<no image>"]);

//Benutzerliste mit Spielern aktualisieren
socket.on(channel_name+'get-players',  data => {
	for(var t=0;t<data.ids.length;t++)
		document.getElementById(data.ids[t]).innerHTML=data.users[data.ids[t]];
})

socket.on(channel_name+'get-users',  () => {
	socket.emit(channel_name+'request-players', {});
})

socket.emit(channel_name+'watch-request', {});

socket.on(channel_name+'game-update', msg => {
    if(game&&game.spieler.ressourcen){
        //console.log("game: ")
        //console.log(game)
    }
    else
        console.log("game undefined")
    temp.last_ressourcen=(game.spieler.ressourcen==undefined?{
        holz: 0,
        wolle: 0,
        lehm: 0,
        getreide: 0,
        erz: 0
    }:game.spieler.ressourcen);
    game=game.set(msg);
        var d_ressourcen={
            holz: 0,
            wolle: 0,
            lehm: 0,
            getreide: 0,
            erz: 0
        };
        //console.log("temp: ")
        //console.log(temp)
        if(game.spieler.ressourcen)
            for(var key in game.spieler.ressourcen){
                d_ressourcen[key]=(game.spieler.ressourcen[key]-temp["last_ressourcen"][key]);
                //console.log("d: "+(game.spieler.ressourcen[key]-temp["last_ressourcen"][key]))
                //console.log("= "+game.spieler.ressourcen[key]+"-"+temp["last_ressourcen"][key]+"=")
                if(d_ressourcen[key]!=0)
                    pop.play()     
        }

        ertrag= d_ressourcen;
 
    
    //console.log("ertrag: ")
    //console.log(ertrag)
    temp.spieler=game.spieler.id;
    redraw();
    if(game.wuerfel[0]!=0)
        roll.play();
   
    for(let i=0; i<game.spieler.siegespunkte;i++)
        setTimeout(() => {
            let one_up= new Audio('/catan/res/Purple Studs SFX.mp3');
            one_up.play();
        }, 500);
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

var ertrag={
    holz: 0,
    wolle: 0,
    lehm: 0,
    getreide: 0,
    erz: 0
};

function redraw_controls(){
    if(game){ 

        if(game.spieler.id !== null && typeof game.spieler !== 'undefined' && typeof game.spieler.ressourcen !== 'undefined')
        {
            uncover('-2');

            var ressourcen=game.spieler.ressourcen;
            var cost=calculateCost();

            document.getElementById('entwicklung').innerText="Entwicklungskarten ziehen: "+temp.entwicklungen;

            var entw=game.spieler.entwicklungen;

            document.getElementById('anz_ritter').innerText=entw.ritter.length;
            document.getElementById('anz_fortschritt').innerText=entw.fortschritt.length;
            document.getElementById('anz_sp').innerText=entw.siegespunkt.length;

            var ls_fortschritt=document.getElementById("ls_fortschritt");
            var ls_sp=document.getElementById("ls_sp");

            ls_fortschritt.textContent='';
            ls_sp.textContent='';

            entw.fortschritt.forEach( e => {
                let opt = document.createElement('option');
                opt.innerText = e.toUpperCase() ;
                ls_fortschritt.appendChild(opt);
            });

            entw.siegespunkt.forEach( e => {
                let opt = document.createElement('option');
                opt.innerText = e.toUpperCase() ;
                ls_sp.appendChild(opt);
            });

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
            

            document.getElementById('d+_holz').innerText=(!ertrag.holz?"":"+"+ertrag.holz);
            document.getElementById('d+_wolle').innerText=(!ertrag.wolle?"":"+"+ertrag.wolle);
            document.getElementById('d+_lehm').innerText=(!ertrag.lehm?"":"+"+ertrag.lehm);
            document.getElementById('d+_getreide').innerText=(!ertrag.getreide?"":"+"+ertrag.getreide);
            document.getElementById('d+_erz').innerText=(!ertrag.erz?"":"+"+ertrag.erz);

            document.getElementById('d-_holz').innerText='-'+cost.holz;
            document.getElementById('d-_wolle').innerText='-'+cost.wolle;
            document.getElementById('d-_lehm').innerText='-'+cost.lehm;
            document.getElementById('d-_getreide').innerText='-'+cost.getreide;
            document.getElementById('d-_erz').innerText='-'+cost.erz;

            document.getElementById('sp_label').innerText=game.spieler.siegespunkte+"/10";
            document.getElementById('sp').value=game.spieler.siegespunkte;
            document.getElementById('w6_0').src="/catan/res/wuerfel/"+(0==game.wuerfel[0]?"loading.gif":"wuerfelaugen-bs-"+game.wuerfel[0]+"-k.png");
            document.getElementById('w6_1').src="/catan/res/wuerfel/"+(0==game.wuerfel[1]?"loading.gif":"wuerfelaugen-bs-"+game.wuerfel[1]+"-k.png");
        };
    }
}

function redraw(){
    start = performance.now();
    render = true;

    if(game){ 
        uncover('-1');

        redraw_controls();

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
        game.wuerfel=[0,0];
        buildMarkedTiles();
        socket.emit(channel_name+'turn', {player: temp.spieler, wege: [...temp.wege], kreuzungen: [...temp.kreuzungen], entwicklungen: temp.entwicklungen});
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
            wege: new Map(),
            entwicklungen: 0
        };
        redraw();
    });

    document.getElementById('bauen').addEventListener('click', e => {
        buildMarkedTiles();
        redraw();
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

    document.getElementById('entwicklung').addEventListener('click', e => {
        temp.entwicklungen++;
        redraw_controls();
    });

/*
    document.getElementById('spieler').addEventListener('click', e => {
        temp.spieler=(temp.spieler+1)%4;
        document.getElementById('spieler').innerText=temp.spieler;
        redraw();
    });
*/
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

        for(let i=0; i<temp.entwicklungen; i++){
            cost.erz++;
            cost.getreide++;
            cost.wolle++;
        }

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
        }
    }