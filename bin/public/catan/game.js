const array = new (require('../catan/array_tools.js'))();
const hex = new (require('../catan/hex.js'))();
const _ = require('lodash');

class spieler {

    id;

    siegespunkte=0;

    bauen={
        strassen: 15,
        siedlungen: 5,
        staedte: 4
    };

    ressourcen={
        holz: 2,
        lehm: 3,
        erz: 69,
        getreide: 0,
        wolle: 0
    };

    entwicklungen={
        ritter: ['generisch','generisch'],
        ausgespielte_ritter: 0,
        siegespunkt: [],
        fortschritt: ['erfindung','erfindung','monopol']
    };

    entwicklung_ausgespielt=false;

    constructor(id){
        this.id=id;
    }
};

class spielfeld{

    karte = [];

    center = null;

    ressourcen = {
        "wald":"holz",
        "huegelland":"lehm",
        "weideland":"wolle",
        "ackerland":"getreide",
        "gebirge":"erz"
    };

    landschaften = { 
        "wald": 4,
        "huegelland": 3,
        "weideland": 4,
        "ackerland": 4,
        "gebirge": 3,
        "wueste": 1
    };

    felder = {};

    blocked = [69];

    zahlen = [5,2,6,3,8,10,9,12,11,4,8,10,9,4,5,6,3,11];

    raeuber = {};

    haefen = [
        {
            position: [{q: 5, r: 0}, {q: 4, r: 1}],
            verhaeltnis: [2, 1],
            ressource: "wolle"  
        },
        {
            position: [{q: 3, r: 0}, {q: 3, r: 1}],
            verhaeltnis: [3, 1],
            ressource: null  
        },
        {
            position: [{q: 1, r: 2}, {q: 2, r: 2}],
            verhaeltnis: [2, 1],
            ressource: "erz"  
        },
        {
            position: [{q: 0, r: 4}, {q: 1, r: 4}],
            verhaeltnis: [2, 1],
            ressource: "getreide"  
        },
        {
            position: [{q: 0, r: 6}, {q: 1, r: 5}],
            verhaeltnis: [3, 1],
            ressource: null  
        },
        {
            position: [{q: 2, r: 6}, {q: 2, r: 5}],
            verhaeltnis: [2, 1],
            ressource: "holz"  
        },
        {
            position: [{q: 4, r: 5}, {q: 4, r: 4}],
            verhaeltnis: [2, 1],
            ressource: "lehm"  
        },
        {
            position: [{q: 6, r: 3}, {q: 5, r: 3}],
            verhaeltnis: [3, 1],
            ressource: null  
        },
        {
            position: [{q: 6, r: 1}, {q: 5, r: 2}],
            verhaeltnis: [3, 1],
            ressource: null  
        }
    ];

    kreuzungen = new Map();
    wege = new Map();

    constructor(size){

        this.kreuzungen.set([{ q: 3, r: 1 },{ q: 2, r: 2 },{ q: 3, r: 2 }], {id: 0, stadt: 1});
        this.wege.set([
            {q:3,r:1},
            {q:2,r:2}
        ],
            {id: 0}
        );

        size=size*2+1;

        this.karte = [{size: size, offset: 0}];

        for(var i=size-1;i>Math.floor(size/2);i--){
            this.karte.unshift({size: i, offset: size-i});
            this.karte.push({size: i, offset: 0});
        }

        //mitte des spielfeldes ermitteln
        this.center={
            q: Math.floor(this.karte.length/2), 
            r: Math.floor(this.karte.length/2)
        };

        //spielfeld erstellen
        var index=0;
        for(let row=0;row<this.karte.length;row++)
            for(var tile=0;tile<this.karte[row].size;tile++){
                    this.felder[tile+this.karte[row].offset+"/"+row]={
                        q: tile+this.karte[row].offset,
                        r: row,
                        blocked: false,
                        landschaft: null,
                        zahl: null
                    };
                    index++;
            }   
        //manuell blockierte felder als solche markieren
        var a=0, b=0;
        for(let key in this.felder){
            if(this.blocked[b]==a){
                this.felder[key].blocked=true;
                b++;
            }
            a++;
        }
        //ring blockierter felder erstellen
        hex.ring({q: this.karte.length-1,r: 0}, this.karte[0].offset).forEach(blocked_tile => {
            this.felder[blocked_tile.q+"/"+blocked_tile.r].blocked=true;
        });
        //landschaftskarten stapel erstellen
        var landschaftsfelder=[];
        for(let key in this.landschaften)
            for(let i=0;i<this.landschaften[key];i++)
                landschaftsfelder.push(key);
        //landschaftskarten stapel mischen
        landschaftsfelder=array.shuffleArray(landschaftsfelder);
        //landschaftskarten verteilen räuber auf wüste plazieren
        index=0;
        for(let key in this.felder){
            if (this.felder.hasOwnProperty(key)){
                var data=this.felder[key];
                if(!data.blocked){
                    if(landschaftsfelder[index%landschaftsfelder.length]=="wueste")
                        this.raeuber={q: data.q, r: data.r};
                    data.landschaft=landschaftsfelder[index++%landschaftsfelder.length];
                }
            }
        }
        //zahlenchips verteilen
        index=0;
        var eckfeld=Math.floor(Math.random()*6);
        hex.spiral({q: size-2,r: 1}, (size-3)/2).forEach(feld => {
            feld=hex.rotate(feld, this.center, eckfeld);
            if(!this.felder[feld.q+"/"+feld.r].blocked){
                this.felder[feld.q+"/"+feld.r].zahl=this.zahlen[index++%this.zahlen.length];
                if(this.felder[feld.q+"/"+feld.r].landschaft=="wueste")
                    index--;
            }
        });
    }

    hashex(array, tile){
        let a = false;
        array.forEach(t => {
            if(hex.isEqual(t, tile))
                a = true;
        });
        return a;
    }

    //DONT USE RETURN IN FOR EACH
    connected(tiles){
        var connected = 0;
        this.game.wege.forEach((value, keys) => {
            if(value.id==spieler_)
                switch(tiles.length){
                    case 2:
                        if((hex.areNeighbours([keys[0],tiles[0]])&&hex.areNeighbours([keys[1],tiles[0]]))||(hex.areNeighbours([keys[0],tiles[1]])&&hex.areNeighbours([keys[1],tiles[1]])))
                            connected ++;
                        break;
                    case 3:
                        if(
                            this.hashex(keys, tiles[0])&&this.hashex(keys, tiles[1])||
                            this.hashex(keys, tiles[1])&&this.hashex(keys, tiles[2])||
                            this.hashex(keys, tiles[2])&&this.hashex(keys, tiles[0])
                        )
                            connected ++;
                        break;
                }
        });
        this.wege_bauen.forEach((value, keys) => {
            if(value.id==spieler_)
                switch(tiles.length){
                    case 2:
                        if((_hex.areNeighbours([keys[0],tiles[0]])&&hex.areNeighbours([keys[1],tiles[0]]))||(hex.areNeighbours([keys[0],tiles[1]])&&hex.areNeighbours([keys[1],tiles[1]])))
                            connected ++;
                        break;
                    case 3:
                        if(
                            this.hashex(keys, tiles[0])&&this.hashex(keys, tiles[1])||
                            this.hashex(keys, tiles[1])&&this.hashex(keys, tiles[2])||
                            this.hashex(keys, tiles[2])&&this.hashex(keys, tiles[0])
                        )
                            connected ++;
                        break;
                }
        });
        return connected;
    }

    spielerKreuzungen(spieler){
        let anzahl = 0;
        this.kreuzungen.forEach((value, keys) => {
            anzahl+=value.id==spieler;
        });
        return anzahl;
    }

    spielerStrassen(spieler){
        let anzahl = 0;
        this.wege.forEach((value, keys) => {
            anzahl+=value.id==spieler;
        });
        return anzahl;
    }

    areAllBlocked(tiles){
        var blocked=true;
        tiles.forEach(tile => {
            if(!this.felder[tile.q+"/"+tile.r].blocked)
                blocked = false;
        });
        return blocked;
    }

    isFree(temp){
        let frei = true;
            if(temp.marked_tiles.length&&!this.areAllBlocked(temp.marked_tiles))
              switch(temp.marked_tiles.length){
                case 2:
                    this.wege.forEach((value, key) => {
                        if(this.hashex(key, temp.marked_tiles[0])&&this.hashex(key, temp.marked_tiles[1]))
                            frei = false;
                    });
                    temp.wege.forEach((value, key) => {
                        if(this.hashex(key, temp.marked_tiles[0])&&this.hashex(key, temp.marked_tiles[1]))
                            frei = false;
                    });
                    return frei;
                case 3:
                    this.kreuzungen.forEach((value, key) => {
                        if(
                            (
                                (this.hashex(key, temp.marked_tiles[0])&&this.hashex(key, temp.marked_tiles[1]))||
                                (this.hashex(key, temp.marked_tiles[1])&&this.hashex(key, temp.marked_tiles[2]))||
                                (this.hashex(key, temp.marked_tiles[2])&&this.hashex(key, temp.marked_tiles[0]))
                            )
                        )
                            frei = false;
                    });
                    temp.kreuzungen.forEach((value, key) => {
                        if(
                            (
                                (this.hashex(key, temp.marked_tiles[0])&&this.hashex(key, temp.marked_tiles[1]))||
                                (this.hashex(key, temp.marked_tiles[1])&&this.hashex(key, temp.marked_tiles[2]))||
                                (this.hashex(key, temp.marked_tiles[2])&&this.hashex(key, temp.marked_tiles[0]))
                            )
                        )
                            frei = false;
                    });
                    return frei;
            }
        return false;
    }
};

exports.spiel = class{

    runde = 0;
    wuerfel = [0,0];
    bereits_gewuerfelt=false;

    spieler = [];

    spielfeld = {};

    entwicklungen = {
        "fortschritt": {
            "monopol": 2,
            "strassenbau": 2,
            "erfindug": 2
        },
        "siegespunkt": {
            "bibliothek": 1,
            "marktplatz":1 ,
            "rathaus": 1,
            "kirche": 1,
            "universität": 1 
        },
        "ritter": {
            "generisch": 14
        }
    };

    entwicklungsstapel = [];

    laengste_handelsstrasse;
    groesste_rittermacht=0;

    constructor(size){

        this.spielfeld = new spielfeld(size||3);

        for(var i=0;i<4;i++)
            this.spieler.push(new spieler(i));
        
        //entwicklungskarten stapel erstellen
        for(let key in this.entwicklungen)
            for(let key_ in this.entwicklungen[key]){
                var karte = {};
                karte[key] = key_;
                this.entwicklungsstapel=this.entwicklungsstapel.concat(new Array(this.entwicklungen[key][key_]).fill(karte));
            }
        //entwicklungsstapel mischen        
        this.entwicklungsstapel=array.shuffleArray(this.entwicklungsstapel);
    }

    forPlayer(player){

        var json = _.cloneDeep(this);

        if(player>-1&&player<4)
            json.spieler=this.spieler[player];
        else
            json.spieler=undefined;

        json.spielfeld.wege=[...this.spielfeld.wege];
        json.spielfeld.kreuzungen=[...this.spielfeld.kreuzungen];

        return json;
    }

    neue_runde(phase){
        //if(this.spielerStrassen(temp.spieler)>=2&&this.spielerKreuzungen(temp.spieler)>=2)

        this.spieler.forEach(p => {
            p.entwicklung_ausgespielt=false;
        });

        var data = {runde: {}, id: {}}

        this.wuerfel = [0,0];
        this.bereits_gewuerfelt=false;

        this.grm_ermitteln();
        this.sp_berechnen();

        data.runde=++this.runde;
        data.id=this.runde%4;

        return data;
    }

    zug_bauen(data, id){
        for (let entry of data.wege)
            if(!this.spielfeld.wege.has(entry[0])&&this.spieler[id].bauen.strassen>0){
                this.spieler[id].bauen.strassen--;
                this.spielfeld.wege.set(entry[0], {id: id});
            }
            else
                return -1;
        for (let entry of data.kreuzungen)
            if(!this.spielfeld.kreuzungen.has(entry[0])&&(entry[1].stadt?this.spieler[id].bauen.staedte>0:this.spieler[id].bauen.siedlungen>0)){
                entry[1].stadt?this.spieler[id].bauen.staedte--:this.spieler[id].bauen.siedlungen--;
                this.spielfeld.kreuzungen.set(entry[0], {id: id, stadt: entry[1].stadt});
            }
            else
                return -1;
    }

    zug_beenden(data, id){
         if(this.runde>11) { 
            this.zug_bauen(data, id);
            if(this.entwicklungsstapel.length>=data.entwicklungen)
                for(let i=0; i<data.entwicklungen; i++){
                    let entw = this.entwicklungsstapel.pop();
                    let entw_typ = Object.keys(entw)[0]
                    this.spieler[id].entwicklungen[entw_typ].push(entw[entw_typ]);
                }
            else   
                return -1;
        }
        else if (this.runde>=4) {
            if(data.wege.length==1&&data.kreuzungen.length==1){
                this.zug_bauen(data, id)
            }
            else
                return -1;
        }
        else
            return -1;
    }

    ergebnisse = [];
    best_roll(){
        var best=0;
        for(var i=1; i<4; i++)
            if(this.ergebnisse[best]<this.ergebnisse[i])
                best=i;
        return best;
    }

    wuerfeln(){
        if(this.bereits_gewuerfelt)
            return -1;

        this.wuerfel[0]=Math.floor(Math.random()*6+1);
        this.wuerfel[1]=Math.floor(Math.random()*6+1);
        let wert=this.wuerfel[0]+this.wuerfel[1]

        if(this.runde<4){
            this.ergebnisse.push(wert);
            console.log(this.ergebnisse)
            if(this.runde==3){
                this.runde+=this.best_roll()+1;
                this.bereits_gewuerfelt=false;
            }
            else
                this.runde++;
        }
        else{      
            this.bereits_gewuerfelt=true;
            this.res_verteilen();
        }

        return wert;
    }

    res_verteilen(){
        this.spielfeld.kreuzungen.forEach((bauwerk, pos) => {
            pos.forEach(p => {
                let anliegendes_feld=this.spielfeld.felder[p.q+"/"+p.r];
                if(anliegendes_feld.zahl==(this.wuerfel[0]+this.wuerfel[1]))
                    this.spieler[bauwerk.id].ressourcen[this.spielfeld.ressourcen[anliegendes_feld.landschaft]]+=1+bauwerk.stadt;
            });

        });
    }

    lhs_ermitteln(){
        
    }

    grm_ermitteln(){
        for(var i=0; i<4; i++){
            if(this.spieler[i].entwicklungen.ausgespielte_ritter>this.spieler[this.groesste_rittermacht].entwicklungen.ausgespielte_ritter)
                this.groesste_rittermacht=i;
        }
    }

    sp_berechnen(){
        for(var i=0; i<4; i++){
            this.spieler[i].siegespunkte=0;
            this.spieler[i].siegespunkte+=2*(this.laengste_handelsstrasse==i)+2*(this.groesste_rittermacht==i)+this.spieler[i].entwicklungen.siegespunkt.length;
        }
        this.spielfeld.kreuzungen.forEach(bauwerk => {
            this.spieler[bauwerk.id].siegespunkte+=1+bauwerk.stadt;
        });
    }

    ritter_ausspielen(spieler_ritter_id, spieler_opfer_id, raeuber_feld){
        if(
               !this.spieler[spieler_ritter_id].entwicklung_ausgespielt
            && this.spieler[spieler_ritter_id].entwicklungen.ritter.length>0
            && !this.spielfeld.felder[raeuber_feld.q+"/"+raeuber_feld.r].blocked
            && !hex.isEqual(raeuber_feld, this.spielfeld.raeuber)
        ){
            this.spieler[spieler_ritter_id].entwicklung_ausgespielt=true;
            this.spieler[spieler_ritter_id].entwicklungen.ritter.length--;
            this.spieler[spieler_ritter_id].entwicklungen.ausgespielte_ritter++;
            this.spielfeld.raeuber=raeuber_feld;

            let bereits_ausgeraubt=false;
            this.spielfeld.kreuzungen.forEach((value, key) => {
                key.forEach(pos => {
                    if(hex.isEqual(raeuber_feld,pos)&&value.id!=spieler_ritter_id&&!bereits_ausgeraubt){
                        this.karte_ziehen(spieler_ritter_id, spieler_opfer_id);
                        bereits_ausgeraubt=true;
                    }
                });
            });
        }
        else
            return -1;
    }

    fortschritt_ausspielen(id, typ, ressourcen){
        if(this.spieler[id].entwicklungen.fortschritt.includes(typ)&&!this.spieler[id].entwicklung_ausgespielt){
            switch(typ){
                case 'monopol':
                    let done=false;
                    Object.entries(ressourcen).forEach(([res, anz]) => {
                        if(anz>0&&!done){
                            this.spieler.forEach(player => {
                                if(player.id!=id){
                                    this.spieler[id].ressourcen[res]+=player.ressourcen[res];
                                    player.ressourcen[res]=0;
                                }
                            });
                            done=true;
                        }
                    });
                    if(!done)
                        return -1;
                    break;
                case 'erfindung':
                    let erfindung_res=[];
                    Object.entries(ressourcen).forEach(([res, anz]) => {
                        if(anz>0)
                            erfindung_res.push(res);
                    });
                    if(!erfindung_res||erfindung_res.length<2)
                        return -1;
                    for(let i=0; i<2; i++)
                        this.spieler[id].ressourcen[erfindung_res[i]]++;
                    break;
                case 'strassenbau':
                    break;
                default:
                    return -1;
            }
            this.spieler[id].entwicklungen.fortschritt.splice(this.spieler[id].entwicklungen.fortschritt.indexOf(typ), 1);
            this.spieler[id].entwicklung_ausgespielt=true;
        }
    }

    check_res(rx_id, tx_id, offer){
        if(tx_id!=-1&&this.genug_res(rx_id, offer, 1)&&this.genug_res(tx_id, offer, -1))
            return true;
        return false;
    }

    handeln(rx_id, tx_id, offer){
        if(this.check_res(rx_id, tx_id, offer))
            Object.entries(offer).forEach(([res, anz]) => {
                this.spieler[rx_id].ressourcen[res]+=anz;
                this.spieler[tx_id].ressourcen[res]-=anz;
            });
        else
            return -1;
    }

    genug_res(id, delta, mul){
        let valid=true;
        Object.entries(delta).forEach(([res, anz]) => {
            if((this.spieler[id].ressourcen[res]+anz*mul)<0)
                valid=false;
        });
        return valid;
    }

    karte_ziehen(rx_id, tx_id){
        let karte=this.zufaellige_karte(tx_id);

        if(karte==-1)
            return;

        this.spieler[tx_id].ressourcen[karte]--;
        this.spieler[rx_id].ressourcen[karte]++;
    }

    zufaellige_karte(spieler_id){
        let karte=-1, total=0, head=0;
        let pool=Object.entries(this.spieler[spieler_id].ressourcen);

        pool.forEach(([res, anz]) => {
            total+=anz;
        });

        let random=Math.floor(Math.random()*total);
 
        pool.forEach(([res, anz]) => {
            head+=anz;
            if(random<head&&karte==-1)
                karte=res;
        });

        return karte;
    }
};
