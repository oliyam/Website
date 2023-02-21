import * as _hex from "/catan/hex.js";

export class _view extends HTMLCanvasElement{

    size=50;
    width;
    height;
    x=0;
    y=0;
    
    mouse_x;mouse_y;click=0;
    last_x;last_y;click_last=0;

    offset_x=0;offset_y=0;

    game;
    positions = new Map();
    
    temp = {
        stadt: false,
        spieler: 0,
        marked_tiles: [],
        kreuzungen: new Map(),
        wege: new Map()
    };

    objects = [];

    farben_landschaften = {
        "wald": "027800",
        "huegelland": "9c5819",
        "weideland": "10c21e",
        "ackerland": "fad92f",
        "gebirge": "666666",
        "wueste": "ba8f23"
    };

    bilder_landschaften = {
        "wald": "/res/wald.jpg",
        "huegelland": "9c5819",
        "weideland": "10c21e",
        "ackerland": "fad92f",
        "gebirge": "666666",
        "wueste": "ba8f23"
    }

    farben_spieler = [
        "FF0000",
        "0000FF",
        "FFFFFF",
        "FF8C00"
    ];

    constructor(game, temp, width, height, size){
        super();
        this.game=game;
        this.temp=temp;
        this.width=width;
        this.height=height;
        super.width=width;
        super.height=height;

        this.drawGame(game, temp, width, height, size);
    }    


    
    getTemp(){
        return this.temp;
    }

    drawGame(game, temp, width, height, size){
        this.game=game;
        this.temp=temp;
    
        super.getContext("2d").clearRect(0, 0, 600, 600);

        this.size=size;
        var hex_x = _hex.getHexSize(this.size).x, hex_y = _hex.getHexSize(this.size).y;

        //index der längsten reihe
        var _index = 0, index = 0;
        this.game.karte.forEach(reihe => {
            if(reihe.size>this.game.karte[_index].size)
                _index=index;
            index++;
        });

        this.x = ((this.width-hex_x*this.game.karte[_index].size)+hex_x*(-(_index)-2*this.game.karte[_index].offset)+hex_x)/2;
        this.y = ((this.height-hex_y*(this.game.karte.length*3/4+1/4))+hex_y)/2;

        this.drawTiles();

        this.game.haefen.forEach(hafen => {
            this.drawHafen(hafen);
        });

        this.drawOutlines();

        this.temp.wege.forEach((value, key) => {
            this.drawStrasse(value, key, this.farben_spieler[value.id]);
        });

        this.game.wege.forEach((value, key) => {
            this.drawStrasse(value, key, this.farben_spieler[value.id]);
        });
        
        this.temp.kreuzungen.forEach((value, key) => {
            this.drawKreuzung(value, key, this.farben_spieler[value.id]);
        });

        this.game.kreuzungen.forEach((value, key) => {
            this.drawKreuzung(value, key, this.farben_spieler[value.id]);
        });

        this.drawMarkedTiles(this.temp.spieler);
        
        if(this.click_last&&this.click){
            this.offset_x += this.mouse_x-this.last_x;
            this.offset_y += this.mouse_y-this.last_y;
        }

        this.click_last=this.click;
        this.last_x=this.mouse_x;
        this.last_y=this.mouse_y;
    }

    drawTiles(){

        for(let key in this.game.felder){
            if (this.game.felder.hasOwnProperty(key)){
                var data=this.game.felder[key];
                var hex = {
                    q: data.q,
                    r: data.r
                };

                var x=this.x+_hex.hexToPixel(hex, this.size).x+this.offset_x;
                var y=this.y+_hex.hexToPixel(hex, this.size).y+this.offset_y;

                this.positions[hex.q+"/"+hex.r]={x: x, y: y};

                let g = this.getContext("2d");
        
                        if(!data.blocked){/*
                            g.strokeStyle = "#"+this.farben_landschaften[data.landschaft];
                            var imag = new Image();
                            imag.src = this.bilder_landschaften[data.landschaft];
                            this.append(imag);
                            var pattern = g.createPattern(imag, 'repeat');
                            g.fillStyle = pattern;
*/
                            g.lineWidth = this.size/5;
                            g.strokeStyle = "#"+this.farben_landschaften[data.landschaft];
                            g.fillStyle = "#"+this.farben_landschaften[data.landschaft];
                        }
                        else{
                            g.fillStyle = "rgba(0,0,0,0)";
                            g.lineWidth = this.size/5;
                            g.strokeStyle = "#2693ff";
                        }
  

                    g.beginPath();
                    polygon(g, x, y, this.size, 6, Math.PI/2, 0)
                    if(g.isPointInPath(this.mouse_x, this.mouse_y)){
                        g.fillStyle = "#ff00ff";
                        if(this.click){
                            if(!this.temp.marked_tiles.some(e => _hex.isEqual(e, hex))&&this.temp.marked_tiles.length<3)
                                this.temp.marked_tiles.push(hex)
                            else
                                this.temp.marked_tiles=this.temp.marked_tiles.filter(e => !_hex.isEqual(e, hex))
                        }
                    }
                    g.fill();

                    g.beginPath();
                    polygon(g, x, y, this.size-this.size/10, 6, Math.PI/2, 0)
                    g.stroke();

                    if(this.temp.marked_tiles.some(e => _hex.isEqual(e, hex))){
                        g.lineWidth = this.size/5;
                        g.strokeStyle = "#FF0088";
                        g.beginPath();
                        polygon(g, x, y, this.size-this.size/10, 6, Math.PI/2, 0)
                        g.stroke();
                    }
                    if(_hex.isEqual(this.game.raeuber, hex)){
                        g.fillStyle = "#000000";  
                        g.beginPath();
                        g.arc(x, y, this.size/4, 0, 2*Math.PI)
                        g.fill()
                    }
                    else if(data.landschaft!="wueste"&&!data.blocked){
                        g.beginPath();
                        g.fillStyle = "#F2AC44";
                        g.arc(x, y, this.size*0.8/2, 0, 2*Math.PI)
                        g.fill();
                    
                        g.beginPath();
                        g.lineWidth = this.size/25;
                        g.strokeStyle = "#000000"; 
                        g.arc(x, y, this.size*0.8/2, 0, 2*Math.PI)
                        g.stroke()

                        g.fillStyle = data.zahl==6||data.zahl==8?'red':'black';
                        g.font = "bold "+this.size/2+"px Monospace";
                        var nr=data.zahl+(data.zahl==6||data.zahl==9?'.':'');
                        g.fillText(nr, x-g.measureText(nr).width/2, y+this.size*0.8/2-this.size/4); 
                    }
                }
            }
        }
    
    drawOutlines(){
        
        for(let key in this.game.felder){
            if (this.game.felder.hasOwnProperty(key)){
                var data=this.game.felder[key];
                var hex = {
                    q: data.q,
                    r: data.r
                };

                var x=this.x+_hex.hexToPixel(hex, this.size).x+this.offset_x;
                var y=this.y+_hex.hexToPixel(hex, this.size).y+this.offset_y;

                let g = this.getContext("2d");
                if(data.blocked){
                    g.lineWidth = this.size/10;
                    g.strokeStyle = "#FFFFFF";
                    g.beginPath();
                    polygon(g, x, y, this.size, 6, Math.PI/2, 0)
                    g.stroke();
                }
            }
        }

        for(let key in this.game.felder){
            if (this.game.felder.hasOwnProperty(key)){
                var data=this.game.felder[key];
                var hex = {
                    q: data.q,
                    r: data.r
                };

                var x=this.x+_hex.hexToPixel(hex, this.size).x+this.offset_x;
                var y=this.y+_hex.hexToPixel(hex, this.size).y+this.offset_y;

                let g = this.getContext("2d");
                if(!data.blocked){
                    g.lineWidth = this.size/10;
                    g.strokeStyle = "#F2AC44";
                    g.beginPath();
                    polygon(g, x, y, this.size, 6, Math.PI/2, 0)
                    g.stroke();
                }
            }
        }
    }
        
    drawStrasse(value, key, color){
        let g = this.getContext("2d");

        var x=(this.positions[key[0].q+"/"+key[0].r].x+this.positions[key[1].q+"/"+key[1].r].x)/2;
        var y=(this.positions[key[0].q+"/"+key[0].r].y+this.positions[key[1].q+"/"+key[1].r].y)/2;
        var vec_x=(this.positions[key[0].q+"/"+key[0].r].x-this.positions[key[1].q+"/"+key[1].r].x)/8;
        var vec_y=(this.positions[key[0].q+"/"+key[0].r].y-this.positions[key[1].q+"/"+key[1].r].y)/8;

        g.lineWidth = this.size/10;
        g.strokeStyle = "#F2AC44"; 
        g.beginPath();
        g.arc(x+vec_y, y-vec_x, this.size/18, 0, 2*Math.PI) 
        g.arc(x-vec_y, y+vec_x, this.size/18, 0, 2*Math.PI) 
        g.stroke()
        g.lineWidth = this.size/5;
        g.beginPath();
        g.moveTo(x+vec_y, y-vec_x);
        g.lineTo(x-vec_y, y+vec_x);
        g.stroke()

        g.fillStyle = "#"+color;
        g.beginPath();
        g.arc(x+vec_y, y-vec_x, this.size/25, 0, 2*Math.PI) 
        g.arc(x-vec_y, y+vec_x, this.size/25, 0, 2*Math.PI) 
        g.fill()
        g.strokeStyle = "#"+color;
        g.lineWidth = this.size/12;
        g.beginPath();
        g.moveTo(x+vec_y, y-vec_x);
        g.lineTo(x-vec_y, y+vec_x);
        g.stroke()

        
    }

    drawHafen(hafen){
        let g = this.getContext("2d");

        var x0=this.positions[hafen.position[0].q+"/"+hafen.position[0].r].x;
        var y0=this.positions[hafen.position[0].q+"/"+hafen.position[0].r].y;
        var x1=this.positions[hafen.position[1].q+"/"+hafen.position[1].r].x;
        var y1=this.positions[hafen.position[1].q+"/"+hafen.position[1].r].y;
        var b=Math.sqrt((y0-(y0+y1)/2)**2+(x0-(x0+x1)/2)**2);

        g.lineWidth = this.size/10;
        g.strokeStyle = "#47240a"; 
        g.beginPath();
        g.moveTo(x0, y0);
        g.lineTo((x0+x1)/2-(y0-(y0+y1)/2)/b*this.size/2, (y0+y1)/2+(x0-(x0+x1)/2)/b*this.size/2);
        g.moveTo(x0, y0);
        g.lineTo((x0+x1)/2+(y0-(y0+y1)/2)/b*this.size/2, (y0+y1)/2-(x0-(x0+x1)/2)/b*this.size/2);
        g.stroke();

        if(hafen.ressource)
            g.fillStyle = "#"+this.farben_landschaften[this.game.ressourcen[hafen.ressource]];
        else
            g.fillStyle = "#2693FF";
        g.beginPath();
        g.arc(x0, y0, this.size*0.8/2, 0, 2*Math.PI)
        g.fill();
    
        g.beginPath();
        g.lineWidth = this.size/25;
        g.strokeStyle = "#ffffff"; 
        g.arc(x0, y0, this.size*0.8/2, 0, 2*Math.PI)
        g.stroke()


        g.font = "bold "+this.size/3+"px Monospace";
        var nr=hafen.verhaeltnis[0]+":"+hafen.verhaeltnis[1];

        g.lineWidth = this.size/12;
        g.strokeStyle = "#000000"; 
        g.strokeText(nr, x0-g.measureText(nr).width/2, y0+this.size*0.8/3-this.size/3/2); 
        
        g.fillStyle = "#ffffff";
        g.fillText(nr, x0-g.measureText(nr).width/2, y0+this.size*0.8/3-this.size/3/2);
    }

    drawKreuzung(value, key, color){
        let g = this.getContext("2d");

        var pos={
            x: 0,
            y: 0
        };
        key.forEach(e => {
            pos.x+=this.positions[e.q+"/"+e.r].x;
            pos.y+=this.positions[e.q+"/"+e.r].y;
        });

        g.lineWidth = this.size/10;
        g.strokeStyle = "#F2AC44";
        g.fillStyle = "#"+color;
        g.beginPath();
        polygon(g, pos.x/3, pos.y/3, this.size*(value.stadt?1/4:1/6), 6, !value.stadt*Math.PI/180*30, 0);
        g.fill();
        g.stroke();

    }

    drawMarkedTiles(player){
        
        if(_hex.areNeighbours(this.temp.marked_tiles)&&this.game.isFree(this.temp)){
            switch(this.temp.marked_tiles.length){
                case 2:
                    this.drawStrasse({id: this.temp.spieler}, this.temp.marked_tiles, this.farben_spieler[player]);
                    break;
                case 3:
                    this.drawKreuzung({id: this.temp.spieler, stadt: this.temp.stadt}, this.temp.marked_tiles, this.farben_spieler[player]);
                    break;
            }
        }
    }
}

customElements.define("map-view", _view, { extends: 'canvas' });

function polygon(ctx, x, y, radius, sides, startAngle, anticlockwise) {
    if (sides < 3) return;
    var a = (Math.PI * 2)/sides;
    a = anticlockwise?-a:a;
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(startAngle);
    ctx.moveTo(radius,0);
    for (var i = 1; i < sides; i++) {
      ctx.lineTo(radius*Math.cos(a*i),radius*Math.sin(a*i));
    }
    ctx.closePath();
    ctx.restore();
  }