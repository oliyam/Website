
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

    brett=[[],[]];

    constructor(size){       
        size=size||5;
        this.land=Array(size);
        for(var o=0;o<size;o++){
            var i=size-Math.abs(o%size-Math.floor(size/2));
            this.land.push(Array(i));
            this.brett[0].push(Array(i*2), Array(i+1));
            this.brett[1].push(Array(i*2+1));
            if(o==Math.floor(size/2)){
                this.brett[0].push(Array(i*2));
                this.brett[1].push(Array(i*2+1));
            }
        }  
    }

    kreuzungen(weg){
        
    }

    bauen(x, y, id, typ){
        var s=typ!='strasse';
        if(this.spieler[id]!=null&&this.spieler[id].bauen[typ]>0&&this.brett[s][y][x]==null){
            this.brett[s][y][x]=s?id:{id, typ};
            this.spieler[id].bauen[typ]--;
        }
    }

    laengste_strasse(){

        function scan(x, y){

        }
        this.spieler.forEach(e => {
            
        });
    }
};

class spiel {

    brett;
    spieler; 
};
new spiel;