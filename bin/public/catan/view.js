import * as _hex from "/catan/hex.js";

class graphics extends PIXI.Graphics{
    marked = false;
    q;
    r;
    constructor(q, r){
        super();
        this.q=q;
        this.r=r;
    }
}

export class _view extends PIXI.Container{

    size=50;
    width;
    height;
    x;
    y;
    
    game;
    positions = new Map();;
    
    temp = {
        graphics: new PIXI.Graphics(),
        stadt: false,
        spieler: 0,
        marked_tiles: []
    }

    constructor(game, width, height){
        super();
        this.game=game;
        this.width=width;
        this.height=height;
    }    

    drawGame(){
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

        this.game.wege_bauen.forEach((value, key) => {
            this.drawStrasse(value, key, this.game.farben_spieler[value.id]);
        });

        this.game.wege.forEach((value, key) => {
            this.drawStrasse(value, key, this.game.farben_spieler[value.id]);
        });
        
        this.game.kreuzungen_bauen.forEach((value, key) => {
            this.drawKreuzung(value, key);
        });

        this.game.kreuzungen.forEach((value, key) => {
            this.drawKreuzung(value, key);
        });
        
    }

    drawTiles(){
        for(let key in this.game.felder){
            if (this.game.felder.hasOwnProperty(key)){
                var data=this.game.felder[key];
                var hex = {
                    q: data.q,
                    r: data.r
                };

                var x=this.x+_hex.hexToPixel(hex, this.size).x;
                var y=this.y+_hex.hexToPixel(hex, this.size).y;

                this.positions[hex.q+"/"+hex.r]={x: x, y: y};

                let g = new graphics(hex.q, hex.r);
                if(!data.blocked){
                    g.beginFill(this.game.farben_landschaften[data.landschaft], 0.6);
                    g.drawRegularPolygon(x, y, this.size, 6, 0);
                    if(data.raeuber){
                        g.beginFill(0x000000, 1);  
                        g.drawCircle(x, y, this.size/4)
                    }
                    else if(data.landschaft!="wueste"){
                        g.beginFill(0xF2AC44, 1);
                        g.drawCircle(x, y, this.size/4)
                        let text = new PIXI.Container;
                        text.addChild(new PIXI.Text(data.zahl+(data.zahl==6||data.zahl==9?'.':''), {
                            align: "center",
                            fontFamily: 'Times New Roman',
                            fontSize: this.size/3,
                            fontWeight: 'bold',
                            fill: data.zahl==6||data.zahl==8?'red':'black',
                        }));
                        text.x=x-text.width/2;
                        text.y=y-this.size/3/2; 
                        g.addChild(text);
                    }
                    g.endFill();
                    super.addChild(g);
                    let g_outline = new PIXI.Graphics();
                    g_outline.lineStyle(4, 0xF2AC44);
                    g_outline.drawRegularPolygon(x, y, this.size, 6, 0);
                    super.addChild(g_outline);
                }
                else{
                    g.beginFill(0x2693FF, 0.5);
                    g.drawRegularPolygon(x, y, this.size, 6, 0);
                    g.endFill();
                    super.addChild(g);
                }
                g.hitArea = new PIXI.Polygon(_hex.getHex(x, y, this.size, true));
                g.interactive = true;
                g.on('pointerover', e => {
                    if(!g.marked)
                        g.tint = 0x666666;
                });
                g.on('pointerout', e => {
                    if(!g.marked)
                        g.tint = 0xFFFFFF;
                });
                g.on('pointerdown', e => {
                    console.log(g.q+" "+g.r)
                    if(!g.marked&&this.temp.marked_tiles.length<3){
                        g.tint = 0x333333;
                        g.marked = true;
                        this.temp.marked_tiles.push({q: g.q,r: g.r});
                    }
                    else{
                        g.tint = 0x666666;
                        g.marked = false;
                        this.temp.marked_tiles = this.temp.marked_tiles.filter(tile => !(tile.q==g.q&&tile.r==g.r));
                    }
                    this.drawMarkedTiles()
                });
            }
        }
    }

    drawStrasse(value, key){
        var x=(this.positions[key[0].q+"/"+key[0].r].x-this.positions[key[1].q+"/"+key[1].r].x)/10;
        var y=(this.positions[key[0].q+"/"+key[0].r].y-this.positions[key[1].q+"/"+key[1].r].y)/10;

        let graphics = new PIXI.Graphics();
        graphics.position.x=(this.positions[key[0].q+"/"+key[0].r].x+this.positions[key[1].q+"/"+key[1].r].x)/2;
        graphics.position.y=(this.positions[key[0].q+"/"+key[0].r].y+this.positions[key[1].q+"/"+key[1].r].y)/2;
        graphics.lineStyle(4, 0xF2AC44);
        graphics.beginFill(this.game.farben_spieler[value.id], 1);
        graphics.drawCircle(-x, -y, this.size/16);
        graphics.drawCircle(x, y, this.size/16);
        graphics.lineStyle(10, 0xF2AC44);
        graphics.moveTo(-x, -y)
        graphics.lineTo(x, y);
        graphics.lineStyle(4, this.game.farben_spieler[value.id]);
        graphics.moveTo(-x, -y)
        graphics.lineTo(x, y);
        graphics.rotation=Math.PI/180*90;
        super.addChild(graphics);

        return graphics;
    }

    drawKreuzung(value, key){
        var pos={
            x: 0,
            y: 0
        };
        key.forEach(e => {
            pos.x+=this.positions[e.q+"/"+e.r].x;
            pos.y+=this.positions[e.q+"/"+e.r].y;
        });
        let graphics = new PIXI.Graphics();
        graphics.lineStyle(4, 0xF2AC44);
        graphics.beginFill(this.game.farben_spieler[value.id], 1);
        graphics.drawRegularPolygon(pos.x/3, pos.y/3, this.size*(value.stadt?1/5:1/6), 6, value.stadt*Math.PI/180*30);
        graphics.endFill();
        super.addChild(graphics);

        return graphics;
    }

    drawMarkedTiles(){
        this.temp.graphics.clear();
        if(_hex.areNeighbours(this.temp.marked_tiles)&&this.game.isFree(this.temp.marked_tiles)){
            switch(this.temp.marked_tiles.length){
                case 2:
                    this.temp.graphics = this.drawStrasse({id: this.temp.spieler}, this.temp.marked_tiles);
                    break;
                case 3:
                    this.temp.graphics = this.drawKreuzung({id: this.temp.spieler, stadt: this.temp.stadt}, this.temp.marked_tiles);
                    break;
            }
        }
    }
}