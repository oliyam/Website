import * as array from "/catan/array_tools.js";
import * as hex from "/catan/hex.js";

class spieler {

    id;

    siegespunkte=0;

    bauen={
        strassen: 15,
        siedlungen: 5,
        staedte: 4
    };

    ressourcen={
        holz: 6,
        lehm: 4,
        erz: 0,
        getreide: 2,
        wolle: 9
    };

    entwicklungen={
        ritter: [],
        siegespunkte: [],
        fortschritt: []
    };

    constructor(id){
        this.id=id;
    }
};

export class spielfeld{

    karte = [
        {size: 4, offset: 3},
        {size: 5, offset: 2},
        {size: 6, offset: 1},
        {size: 7, offset: 0},
        {size: 6, offset: 0},
        {size: 5, offset: 0},
        {size: 4, offset: 0}
    ];

    center = null;

    ressourcen = {
        "holz":"wald",
        "lehm":"huegelland",
        "wolle":"weideland",
        "getreide":"ackerland",
        "erz":"gebirge"
    };

    landschaften = { 
        "wald": 4,
        "huegelland": 3,
        "weideland": 4,
        "ackerland": 4,
        "gebirge": 3,
        "wueste": 1
    };

    felder = [];

    zahlen = [5,2,6,3,8,10,9,12,11,4,8,10,9,4,5,6,3,11];

    raeuber;

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

    constructor(){
        //mitte des spielfeldes ermitteln
        if(this.karte.length%2)
            this.karte.forEach(row => {
                if(row.size%2)
                    this.center={
                        q: Math.ceil(row.size/2), 
                        r: Math.floor(this.karte.length/2)
                    };
                });
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
        //ring blockierter felder erstellen
        hex.ring({q: 6,r: 0}, 3).forEach(blocked_tile => {
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
                    if(landschaftsfelder[index]=="wueste")
                        this.raeuber={q: data.q, r: data.r};
                    data.landschaft=landschaftsfelder[index++];
                }
            }
        }
        //zahlenchips verteilen
        index=0;
        var eckfeld=Math.floor(Math.random()*6);
        hex.spiral({q: 5,r: 1}, 2).forEach(feld => {
            feld=hex.rotate(feld, this.center, eckfeld);
            this.felder[feld.q+"/"+feld.r].zahl=this.zahlen[index++%this.zahlen.length];
            if(this.felder[feld.q+"/"+feld.r].landschaft=="wueste")
                index--;
        });
    }

    has(array, tile){
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
                            this.has(keys, tiles[0])&&this.has(keys, tiles[1])||
                            this.has(keys, tiles[1])&&this.has(keys, tiles[2])||
                            this.has(keys, tiles[2])&&this.has(keys, tiles[0])
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
                            this.has(keys, tiles[0])&&this.has(keys, tiles[1])||
                            this.has(keys, tiles[1])&&this.has(keys, tiles[2])||
                            this.has(keys, tiles[2])&&this.has(keys, tiles[0])
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
                        if(this.has(key, temp.marked_tiles[0])&&this.has(key, temp.marked_tiles[1]))
                            frei = false;
                    });
                    temp.wege.forEach((value, key) => {
                        if(this.has(key, temp.marked_tiles[0])&&this.has(key, temp.marked_tiles[1]))
                            frei = false;
                    });
                    return frei;
                case 3:
                    this.kreuzungen.forEach((value, key) => {
                        if(
                            (
                                (this.has(key, temp.marked_tiles[0])&&this.has(key, temp.marked_tiles[1]))||
                                (this.has(key, temp.marked_tiles[1])&&this.has(key, temp.marked_tiles[2]))||
                                (this.has(key, temp.marked_tiles[2])&&this.has(key, temp.marked_tiles[0]))
                            )
                        )
                            frei = false;
                    });
                    temp.kreuzungen.forEach((value, key) => {
                        if(
                            (
                                (this.has(key, temp.marked_tiles[0])&&this.has(key, temp.marked_tiles[1]))||
                                (this.has(key, temp.marked_tiles[1])&&this.has(key, temp.marked_tiles[2]))||
                                (this.has(key, temp.marked_tiles[2])&&this.has(key, temp.marked_tiles[0]))
                            )
                        )
                            frei = false;
                    });
                    return frei;
            }
        return false;
    }
};

export class spiel{

    runde = 0;
    wuerfel = [4,2];

    spieler = [];

    spielfeld = new spielfeld();

    entwicklungen = {
        "fortschritte": {
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
    groesste_rittermacht;

    constructor(){

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

    runde(){

        //if(this.spielerStrassen(temp.spieler)>=2&&this.spielerKreuzungen(temp.spieler)>=2)

        var aktiver_spieler = runde%4;

        this.wuerfeln()


    }

    wuerfeln(){
        this.wuerfel[0]=Math.floor(Math.random()*6+1);
        this.wuerfel[1]=Math.floor(Math.random()*6+1);

        return this.wuerfel;
    }

    lhs_ermitteln(){

    }

    grm_ermitteln(){
        
    }

    sp_berechnen(){
        for(var spieler in this.spieler){
            spieler.siegespunkte=(5-spieler.bauen.siedlungen)+2*(4-spieler.bauen.steadte)+spieler.entwicklung.siegespunkt
            if(this.grm==spieler.id)
                spieler.siegespunkte+=2
            if(this.lhs==spieler.id)
                spieler.siegespunkte+=2
        }
    }
};
