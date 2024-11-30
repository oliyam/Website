import * as hex from "../catan/hex_client.js"
import * as array from "../catan/array_tools_client.js"

export class spieler {

    id;

    siegespunkte=0;

    bauen={
        strassen: 15,
        siedlungen: 5,
        staedte: 4
    };

    ressourcen={
        holz: 0,
        lehm: 0,
        erz: 0,
        getreide: 0,
        wolle: 0
    };

    entwicklungen={
        ritter: [],
        ausgespielte_ritter: 0,
        siegespunkte: [],
        fortschritt: []
    };

    entwicklung_ausgespielt=false;

    constructor(id){
        this.id=id||null;
    }
};

export class spielfeld{

    karte = [];

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
    wuerfel = [0,0];
    bereits_gewuerfelt=false;

    spieler;

    spielfeld = {};

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

    constructor(size){
        this.spieler = new spieler();

        this.spielfeld = new spielfeld(size||3);
        
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

    set(json){
        //console.log("recieved server game:", json)

        Object.assign(this, json);
        Object.assign(this.spielfeld=new spielfeld(3), json.spielfeld)
        Object.assign(this.spieler, json.spieler)
        
        this.spielfeld.wege=new Map();
        for(let entry of json.spielfeld.wege)
            this.spielfeld.wege.set(entry[0], entry[1]);

        this.spielfeld.kreuzungen=new Map();
        for(let entry of json.spielfeld.kreuzungen)
            this.spielfeld.kreuzungen.set(entry[0], entry[1]);

        //console.log("updated client game", this)
        return this;  
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
