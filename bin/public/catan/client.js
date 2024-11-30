import * as _hex from "../catan/hex_client.js"
import {spiel} from "/catan/game_client.js";
import {_view} from "/catan/view.js";
import * as c from "/chat/channel.js";
import {uncover} from "/preloader/preloader.js";

var farben = [
    "FF0000",
    "0000FF",
    "FFFFFF",
    "FF8C00"
];

var temp = {

    stadt: false,
    spieler: 0,
    marked_tiles: [],
    kreuzungen: new Map(),
    wege: new Map(),
    entwicklungen: 0,
    ritter: {
        feld: undefined,
        opfer: undefined
    }
};

const channel_name='catan'+'>';

const socket=new io();
c.run(socket, 'catan');


var anno = new Audio('/catan/res/Anno Dawn of Discovery Create a New World WII Soundtrack Settlers.mp3');
var roll = new Audio('/catan/res/wuerfel/rolling dice 2.mp3');
var pop = new Audio('/catan/res/pop.mp3');
var mc_death = new Audio('/catan/res/mc_oof.mp3');
var one_up = '/catan/res/Purple Studs SFX.mp3';
var knight = new Audio('/catan/res/sword_clash.mp3');

function _repeat_audio(audio, n){
    let count=1;
    audio.addEventListener('ended', function() {
        if(count<n){
            count++;
            this.play();
        }
    }, false);
    audio.play();
}

function repeat_audio(url, n, delay){
    for(let i=0; i<n;i++)
        setTimeout(() => {new Audio(url).play()}, delay);
}

var size=50;

/*Automatische Spieleranfrage via URL-Query (?player=1)
Nach Rückmenldung der Namensanfrage um eine Spieleranfrage ohne aktiven Socket zu verhindern.
Ansonsten wird der Benutzer auch bei eingabe eines gültigen Namens auf /dea weitergeleitet, 
da die 'pls player'-Anfrage ohne aktiven Socket gesendent wurde.
Erst nach der Bestätigung des Namens wird der Rest ausgeführt.*/
var URL_params=new URLSearchParams(window.location.search);
socket.on(channel_name+'name-valid', (valid) => {if(valid){ 

    socket.emit(channel_name+'watch-request', {});

    anno.loop=true;
    if(URL_params.get('music'))
        anno.play();
    
    var game=new spiel();
    var view=new _view(game, temp, 600, 600, size);
    var map=document.getElementById('map').appendChild(view);
    if(URL_params.get('player'))
        socket.emit(channel_name+'send-chat-msg', ["pls player", "<no image>"]);

    //Benutzerliste mit Spielern aktualisieren
    socket.on(channel_name+'get-players',  data => {
        for(var t=0;t<data.ids.length;t++)
           document.getElementById(data.ids[t]).innerHTML=data.users[data.ids[t]];
    });

    socket.on(channel_name+'get-users',  {});

    socket.on(channel_name+'game-update', msg => {
        temp.last_ressourcen=game.spieler.ressourcen;

        temp.last_entwicklungen={};

        temp.last_sp=game.spieler.siegespunkte;
        
        if(game.spieler.entwicklungen)
            for(var key in game.spieler.entwicklungen)
                temp.last_entwicklungen[key]=game.spieler.entwicklungen[key].length;

        game=game.set(msg.game);
            var d_ressourcen={
                holz: 0,
                wolle: 0,
                lehm: 0,
                getreide: 0,
                erz: 0
            };

            if(game.spieler.ressourcen)
                for(var key in game.spieler.ressourcen){
                    d_ressourcen[key]=(game.spieler.ressourcen[key]-temp["last_ressourcen"][key]);
                        if(d_ressourcen[key])
                           Math.sign(d_ressourcen[key]==-1)?mc_death.play():pop.play()     
            }
            ertrag= d_ressourcen;

            var d_entwicklungen={
                ritter: 0,
                siegespunkte: 0,
                fortschritt: 0
            };

            if(game.spieler.entwicklungen)
                for(var key in game.spieler.entwicklungen)
                    d_entwicklungen[key]=(game.spieler.entwicklungen[key].length-temp["last_entwicklungen"][key]);   

            karten= d_entwicklungen;

            d_sp= game.spieler.siegespunkte-temp.last_sp;

        temp.spieler=game.spieler.id;

        disable_buttons(!(game.runde%4==game.spieler.id));
        if(game.runde%4==game.spieler.id){
            document.getElementById('wuerfeln').disabled=game.bereits_gewuerfelt;
            document.getElementById('ritter_').disabled=game.spieler.entwicklung_ausgespielt;
            document.getElementById('fortschritt_').disabled=game.spieler.entwicklung_ausgespielt;
        }
        else{
            document.getElementById('wuerfeln').disabled=true;
            document.getElementById('ritter_').disabled=true;
            document.getElementById('fortschritt_').disabled=true;
        }

        if(msg.cast)
            roll.play();

        redraw();

        repeat_audio(one_up, d_sp, 500);
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

    var partner=-1;
    var handel={
        holz: 0,
        wolle: 0,
        lehm: 0,
        getreide: 0,
        erz: 0
    };

    var cost={
        holz: 0,
        wolle: 0,
        lehm: 0,
        getreide: 0,
        erz: 0
    };

    var karten={
        ritter: 0,
        siegespunkte: 0,
        fortschritt: 0
    };

    var d_sp=0;

    function redraw_controls(){
        if(game){ 

            if(game.spieler.id !== null && typeof game.spieler !== 'undefined' && typeof game.spieler.ressourcen !== 'undefined')
            {
                uncover('-2');

                var ressourcen=game.spieler.ressourcen;
                cost=calculateCost();

                var ls_ausraubbare_spieler=document.getElementById('ls_ritter');
                ls_ausraubbare_spieler.textContent='';

                if(temp.marked_tiles.length==1)
                    game.spielfeld.kreuzungen.forEach((value, key) => {
                            key.forEach(pos => {
                                if(_hex.isEqual(temp.marked_tiles[0],pos)&&value.id!=game.spieler.id){
                                    let opt = document.createElement('option');
                                    opt.value=value.id;
                                    opt.innerText = "[player-"+value.id+"]";
                                    ls_ausraubbare_spieler.appendChild(opt);
                                }
                            });
                    });

                document.getElementById('d_sp').innerText=(!d_sp?"":"+"+d_sp);

                document.getElementById('entwicklung').innerText="Entwicklungskarten ziehen: "+temp.entwicklungen;

                var entw=game.spieler.entwicklungen;

                document.getElementById('anz_ritter').innerText=entw.ausgespielte_ritter+"/"+entw.ritter.length;
                document.getElementById('anz_fortschritt').innerText=entw.fortschritt.length;
                document.getElementById('anz_sp').innerText=entw.siegespunkt.length;


                document.getElementById('d_anz_ritter').style.color=Math.sign(karten.ritter)==-1?"red":"green";
                document.getElementById('d_anz_ritter').innerText=(karten.ritter?(Math.sign(karten.ritter)==-1?"":"+")+karten.ritter:"");

                document.getElementById('d_anz_fortschritt').style.color=Math.sign(karten.fortschritt)==-1?"red":"green";
                document.getElementById('d_anz_fortschritt').innerText=(karten.fortschritt?(Math.sign(karten.fortschritt)==-1?"":"+")+karten.fortschritt:"");


                document.getElementById('d_anz_sp').innerText=(!karten.siegespunkt?"":"+"+karten.siegespunkt);

                var ls_fortschritt=document.getElementById("ls_fortschritt");
                var ls_sp=document.getElementById("ls_sp");

                ls_fortschritt.textContent='';
                ls_sp.textContent='';

                entw.fortschritt.forEach( e => {
                    let opt = document.createElement('option');
                    opt.value = e;
                    opt.innerText = e.charAt(0).toUpperCase() + e.slice(1);
                    ls_fortschritt.appendChild(opt);
                });


                entw.siegespunkt.forEach( e => {
                    let opt = document.createElement('option');
                    opt.innerText = e.charAt(0).toUpperCase() + e.slice(1);
                    ls_sp.appendChild(opt);
                });


                Object.entries(ressourcen).forEach(([res, anz]) => {

                    document.getElementById('total_'+res).style=anz-cost[res]>=0?"color:white":"color:red";
                    document.getElementById('total_'+res).innerText=anz-cost[res];
                
                    document.getElementById(res).innerText=anz;
                
                    document.getElementById('d+_'+res).style.color=Math.sign(ertrag[res])==-1?"red":"green";
                    document.getElementById('d+_'+res).innerText=(ertrag[res]?(Math.sign(ertrag[res])==-1?"":"+")+ertrag[res]:"");

                    document.getElementById('d-_'+res).innerText='-'+cost[res];

                    document.getElementById('trade_'+res).style.color=Math.sign(handel[res])==-1?"#ff5c33":"white";
                    document.getElementById('trade_'+res).innerText=handel[res];
                });

                document.getElementById('trade_ack').innerText=partner==-1?'Handel':'Handel: [player-'+partner+']';

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

        document.getElementById('wuerfeln').addEventListener('click', e => {
            document.getElementById('wuerfeln').disabled=true;
            game.wuerfel=[0,0];
            socket.emit(channel_name+'cast',{});
            redraw_controls();
        });

        function disable_buttons(active){
            Array.from(document.getElementById("controls").getElementsByTagName('button')).forEach(button => {
                if(button.id!='trade_ack'&&button.id!='wuerfeln'&&!button.id.endsWith('_'))      
                    button.disabled=active;
            });
        }

        document.getElementById('zug_beenden').addEventListener('click', e => {
            if(game.wuerfel[0]+game.wuerfel[1]){
                disable_buttons(true);
                game.wuerfel=[0,0];
                buildMarkedTiles();
                redraw();
                socket.emit(channel_name+'turn', 
                {
                    player: temp.spieler,
                    wege: [...temp.wege],
                    kreuzungen: [...temp.kreuzungen],
                    entwicklungen: temp.entwicklungen,
                    ritter: temp.ritter
                });
                temp = {
                    last_ressourcen: {
                        holz: 0,
                        wolle: 0,
                        lehm: 0,
                        getreide: 0,
                        erz: 0
                    },
                    last_entwicklungen: {
                        ritter: 0,
                        siegespunkte: 0,
                        fortschritt: 0
                    },          
                    last_sp: 0,
                    stadt: false,
                    spieler: temp.spieler,
                    marked_tiles: [],
                    kreuzungen: new Map(),
                    wege: new Map(),
                    entwicklungen: 0,
                    ritter: {
                        feld: undefined,
                        opfer: undefined
                    }
                };
            }
        });
        
        document.getElementById('trade_req').addEventListener('click', e => {
            socket.emit(channel_name + 'trade_req_out', [handel, document.getElementById('trade_partner').value]);
        });

        document.getElementById('trade_ack').addEventListener('click', e => {
            document.getElementById('trade_ack').disabled=true;
            socket.emit(channel_name + 'trade_ack', partner);
            partner=-1;
            handel={
                holz: 0,
                wolle: 0,
                lehm: 0,
                getreide: 0,
                erz: 0
            };
        });

        socket.on(channel_name + 'trade_req_in',  ([res, id]) => {
            document.getElementById('trade_ack').disabled=false;
            Object.entries(res).forEach(([ressource, anz]) => {handel[ressource]=-anz});
            partner=id;
        });


        Object.entries(handel).forEach(([res, anz]) => {
            document.getElementById('trade_'+res+'_+').addEventListener('click', e => {
               handel[res]++;
               redraw_controls();
            });
            document.getElementById('trade_'+res+'_-').addEventListener('click', e => {
               handel[res]--;
               redraw_controls();
            });
        });

        document.getElementById('bauen').addEventListener('click', e => {
            buildMarkedTiles();
            redraw();
            socket.emit(channel_name + 'bauen', 
            {
                player: temp.spieler,
                wege: [...temp.wege],
                kreuzungen: [...temp.kreuzungen],
                entwicklungen: temp.entwicklungen,
                ritter: temp.ritter
            });
            temp = {
                last_ressourcen: {
                    holz: 0,
                    wolle: 0,
                    lehm: 0,
                    getreide: 0,
                    erz: 0
                },
                last_entwicklungen: {
                    ritter: 0,
                    siegespunkte: 0,
                    fortschritt: 0
                },          
                last_sp: 0,
                stadt: false,
                spieler: temp.spieler,
                marked_tiles: [],
                kreuzungen: new Map(),
                wege: new Map(),
                entwicklungen: 0,
                ritter: {
                    feld: undefined,
                    opfer: undefined
                }
            };
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
                last_entwicklungen: {
                    ritter: 0,
                    siegespunkte: 0,
                    fortschritt: 0
                },
                last_sp: 0,
                stadt: false,
                spieler: temp.spieler,
                marked_tiles: [],
                kreuzungen: new Map(),
                wege: new Map(),
                entwicklungen: 0,
                ritter: {
                    feld: undefined,
                    opfer: undefined
                }
            }
            view.temp=temp;
            redraw();
        });

        document.getElementById('stadt').addEventListener('click', e => {
            document.getElementById('stadt').innerText=temp.stadt?'Siedlung':'Stadt';
            temp.stadt=!temp.stadt;
            redraw();
        });

        document.getElementById('ritter_').addEventListener('click', e => {
            if(game.spieler.entwicklungen.ritter.length>0&&temp.marked_tiles.length==1&&!_hex.isEqual(temp.marked_tiles[0], game.spielfeld.raeuber)&&!game.spielfeld.felder[temp.marked_tiles[0].q+"/"+temp.marked_tiles[0].r].blocked){
                temp.ritter.feld=temp.marked_tiles[0];
                temp.ritter.opfer=document.getElementById('ls_ritter').value;
                socket.emit(channel_name + 'ritter_ausspielen', temp);
                knight.play();
            }
        });

        document.getElementById('fortschritt_').addEventListener('click', e => {
            if(game.spieler.entwicklungen.fortschritt.length>0){
                socket.emit(channel_name + 'fortschritt_ausspielen', {type: document.getElementById('ls_fortschritt').value, res: handel});
                partner=-1;
                handel={
                    holz: 0,
                    wolle: 0,
                    lehm: 0,
                    getreide: 0,
                    erz: 0
                };
            }
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
}});