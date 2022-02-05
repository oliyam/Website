
const log = require('../logger/color-logger.js').log;

class spieler {

    id;

    bauen={
        strasse,
        siedlung,
        stadt
    };

    ressourcen={
        holz,
        lehm,
        erz,
        getreide,
        wolle
    };

    entwicklung={
        ritter,
        siegespunkt,
        fortschritt
    };

    constructor(){
        this.bauen=[60,20,16];
    }
};

class brett {

    kreuzung;
    strasse;

    feld=[
        {length: 3, offset: 0},
        {length: 4, offset: 0},
        {length: 5, offset: 0},
        {length: 4, offset: 1},
        {length: 3, offset: 2}
    ];

    landschaften={ 
        "wald": 4,
        "huegelland": 3,
        "weideland": 4,
        "ackerland": 4,
        "gebirge": 3,
        "wueste": 1
    };

    karte_landschaften;

    constructor(size){
        var size=size || 5;
        var karte_landschaften=[];
        for(let key in this.landschaften){
            for(let i=0;i<this.landschaften[key];i++)
                karte_landschaften.push(key)
        }
        karte_landschaften=shuffleArray(karten_landschaften);
    }

};

class spiel {

    brett;
    spieler; 
};



function shuffleArray(array){
    if(Array.isArray(array)){
        for(var i=array.length-1;i>0;i--){
            let j=Math.floor(Math.random()*i+1);
            swapArray(array,i,j);
        }
        return array;
    }
}

function swapArray(array,i,j){
    if(Array.isArray(array)&&i>=0&&j>=0&&i<array.length&&j<array.length){
        let tmp=array[i];
        array[i]=array[j];
        array[j]=tmp;
        return array;
    }
}