import * as _hex from "/catan/hex.js";

var size=50;

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

    width;
    height;
    game;
    positions = new Map();;
    x;
    y;
    temp_graphics = new PIXI.Graphics();
    marked_tiles = [];

    constructor(game, width, height){
        super();
        this.game=game;
        this.width=width;
        this.height=height;
    }    

    drawGame(){
        var hex_x = _hex.getHexSize(size).x, hex_y = _hex.getHexSize(size).y;

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

                var x=this.x+_hex.hexToPixel(hex, size).x;
                var y=this.y+_hex.hexToPixel(hex, size).y;

                this.positions[hex.q+"/"+hex.r]={x: x, y: y};

                let g = new graphics(hex.q, hex.r);
                if(!data.blocked){
                    g.beginFill(this.game.farben_landschaften[data.landschaft], 0.6);
                    g.drawRegularPolygon(x, y, size, 6, 0);
                    if(data.raeuber){
                        g.beginFill(0x000000, 1);  
                        g.drawCircle(x, y, size/4)
                    }
                    else if(data.landschaft!="wueste"){
                        g.beginFill(0xF2AC44, 1);
                        g.drawCircle(x, y, size/4)
                        let text = new PIXI.Container;
                        text.addChild(new PIXI.Text(data.zahl+(data.zahl==6||data.zahl==9?'.':''), {
                            align: "center",
                            fontFamily: 'Times New Roman',
                            fontSize: size/3,
                            fontWeight: 'bold',
                            fill: data.zahl==6||data.zahl==8?'red':'black',
                        }));
                        text.x=x-text.width/2;
                        text.y=y-size/3/2; 
                        g.addChild(text);
                    }
                    g.endFill();
                    super.addChild(g);
                    let g_outline = new PIXI.Graphics();
                    g_outline.lineStyle(4, 0xF2AC44);
                    g_outline.drawRegularPolygon(x, y, size, 6, 0);
                    super.addChild(g_outline);
                }
                else{
                    g.beginFill(0x2693FF, 0.5);
                    g.drawRegularPolygon(x, y, size, 6, 0);
                    g.endFill();
                    super.addChild(g);
                }
                g.hitArea = new PIXI.Polygon(_hex.getHex(x, y, size, true));
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
                    if(!g.marked&&this.marked_tiles.length<3){
                        g.tint = 0x333333;
                        g.marked = true;
                        this.marked_tiles.push({q: g.q,r: g.r});
                    }
                    else{
                        g.tint = 0x666666;
                        g.marked = false;
                        this.marked_tiles = this.marked_tiles.filter(tile => !(tile.q==g.q&&tile.r==g.r));
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
        graphics.drawCircle(-x, -y, size/16);
        graphics.drawCircle(x, y, size/16);
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
        graphics.drawRegularPolygon(pos.x/3, pos.y/3, size*(value.stadt?1/5:1/6), 6, value.stadt*Math.PI/180*30);
        graphics.endFill();
        super.addChild(graphics);

        return graphics;
    }

    drawMarkedTiles(){
        this.temp_graphics.clear();
        if(_hex.areNeighbours(this.marked_tiles)&&isFree(this.marked_tiles)){
            switch(this.marked_tiles.length){
                case 2:
                    this.temp_graphics = this.drawStrasse({id: spieler_}, this.marked_tiles);
                    break;
                case 3:
                    this.temp_graphics = this.drawKreuzung({id: spieler_, stadt: stadt_}, this.marked_tiles);
                    break;
            }
        }
    }

}


function has(array, tile){
    let a = false;
    array.forEach(t => {
        if(isEqual(t, tile))
            a = true;
    });
    return a;
}

//DONT USE RETURN IN FOR EACH

function connected(tiles){
    var connected = 0;
    game_.wege.forEach((value, keys) => {
        if(value.id==spieler_)
            switch(tiles.length){
                case 2:
                    if((_hex.areNeighbours([keys[0],tiles[0]])&&_hex.areNeighbours([keys[1],tiles[0]]))||(_hex.areNeighbours([keys[0],tiles[1]])&&_hex.areNeighbours([keys[1],tiles[1]])))
                        connected ++;
                    break;
                case 3:
                    if(
                        has(keys, tiles[0])&&has(keys, tiles[1])||
                        has(keys, tiles[1])&&has(keys, tiles[2])||
                        has(keys, tiles[2])&&has(keys, tiles[0])
                    )
                        connected ++;
                    break;
            }
    });
    game_.wege_bauen.forEach((value, keys) => {
        if(value.id==spieler_)
            switch(tiles.length){
                case 2:
                    if((_hex.areNeighbours([keys[0],tiles[0]])&&_hex.areNeighbours([keys[1],tiles[0]]))||(_hex.areNeighbours([keys[0],tiles[1]])&&_hex.areNeighbours([keys[1],tiles[1]])))
                        connected ++;
                    break;
                case 3:
                    if(
                        has(keys, tiles[0])&&has(keys, tiles[1])||
                        has(keys, tiles[1])&&has(keys, tiles[2])||
                        has(keys, tiles[2])&&has(keys, tiles[0])
                    )
                        connected ++;
                    break;
            }
    });
    return connected;
}

function spielerKreuzungen(spieler){
    let anzahl = 0;
    game_.kreuzungen_bauen.forEach((value, keys) => {
        anzahl+=value.id==spieler;
    });
    return anzahl;
}

function spielerStrassen(spieler){
    let anzahl = 0;
    game_.wege_bauen.forEach((value, keys) => {
        anzahl+=value.id==spieler;
    });
    return anzahl;
}

function areAllBlocked(tiles){
    var blocked=true;
    tiles.forEach(tile => {
        if(!game_.felder[tile.q+"/"+tile.r].blocked)
            blocked = false;
    });
    return blocked;
}

function isFree(tiles){
    let frei = true;
    if(spielerStrassen(spieler_)<2){
        if(tiles.length==3)
            frei = false;
        else if(tiles.length==2){

        }
    }
    else if(spielerStrassen(spieler_)==2){
        if(tiles.length==3){
            if(connected(tiles)!=1){
                frei = false;
            }
        }
        else{
            frei = false;
        }
    }
    if(spielerStrassen(spieler_)>=2&&spielerKreuzungen(spieler_)>=2)
        frei = true;

    if(tiles.length&&!areAllBlocked(tiles))
        switch(tiles.length){
            case 2:
                    game_.wege.forEach((value, key) => {
                        if(has(key, tiles[0])&&has(key, tiles[1]))
                            frei = false;
                    });
                    game_.wege_bauen.forEach((value, key) => {
                        if(has(key, tiles[0])&&has(key, tiles[1]))
                            frei = false;
                    });
                return frei;
            case 3:
                game_.kreuzungen.forEach((value, key) => {
                    if(
                        (
                            (has(key, tiles[0])&&has(key, tiles[1]))||
                            (has(key, tiles[1])&&has(key, tiles[2]))||
                            (has(key, tiles[2])&&has(key, tiles[0]))
                        )
                    )
                        frei = false;
                });
                game_.kreuzungen_bauen.forEach((value, key) => {
                    if(
                        (
                            (has(key, tiles[0])&&has(key, tiles[1]))||
                            (has(key, tiles[1])&&has(key, tiles[2]))||
                            (has(key, tiles[2])&&has(key, tiles[0]))
                        )
                    )
                        frei = false;
                });
                return frei;
        }
    return false;
}