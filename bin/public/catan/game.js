import * as array from "/catan/array_tools.js";
import * as hex from "/catan/hex.js";

export class game{
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

    farben_spieler = [
        0xFF0000,
        0x0000FF,
        0xFFFFFF,
        0xFFA500
    ];

    farben_landschaften = {
        "wald": 0x027800,
        "huegelland": 0xed5b00,
        "weideland": 0x00FF00,
        "ackerland": 0xfff200,
        "gebirge": 0x666666,
        "wueste": 0xba8f23
    };

    landschaften = { 
        "wald": 4,
        "huegelland": 3,
        "weideland": 4,
        "ackerland": 4,
        "gebirge": 3,
        "wueste": 1
    };

    zahlen = [5,2,6,3,8,10,9,12,11,4,8,10,9,4,5,6,3,11];

    felder = [];

    kreuzungen = new Map();
    wege = new Map();

    kreuzungen_bauen = new Map();
    wege_bauen = new Map();

    constructor(){
        //mitte des spielfeldes
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
                        zahl: null,
                        raeuber: null
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
                landschaftsfelder.push(key)

        //landschaftskarten stapel mischen
        landschaftsfelder=array.shuffleArray(landschaftsfelder);
        
        //landschaftskarten verteilen räuber auf wüste plazieren
        index=0;
        for(let key in this.felder){
            if (this.felder.hasOwnProperty(key)){
                var data=this.felder[key];
                if(!data.blocked){
                    data.landschaft=landschaftsfelder[index]
                    data.raeuber=landschaftsfelder[index++]=="wueste";
                }
            }
        }
        //zahlenchips verteilen
        index=0;
        hex.spiral({q: 5,r: 1}, 2).forEach(feld => {
            this.felder[feld.q+"/"+feld.r].zahl=this.zahlen[index++];
            if(this.felder[feld.q+"/"+feld.r].landschaft=="wueste")
                index--;
        });

        /*
        this.kreuzungen.set([
            {q: 3, r: 0},
            {q: 2, r: 1},
            {q: 3, r: 1}
        ], {id: 0, stadt: true});

        this.wege.set([
            {q: 2, r: 1},
            {q: 3, r: 1}
        ], {id: 0});
        */

    }
};