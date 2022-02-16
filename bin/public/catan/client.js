const app = new PIXI.Application({
    width: 600, height: 600, backgroundColor: 0x000000, backgroundAlpha: 0.5, antialias: true
});

class game{
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

    blocked = [
                    true, true, true, true,
                true, false, false, false, true,
            true, false, false, false, false, true,
        true, false, false, false, false, false, true,
            true, false, false, false, false, true,
                true, false, false, false, true,
                    true, true, true, true
    ]; 

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
        if(this.karte.length%2)
            this.karte.forEach(row => {
                if(row.size%2)
                    this.center={
                        q: Math.ceil(row.size/2), 
                        r: Math.floor(this.karte.length/2)
                    };
                });

        var index=0;
        for(let row=0;row<this.karte.length;row++)
            for(var tile=0;tile<this.karte[row].size;tile++){
                    this.felder[tile+this.karte[row].offset+"/"+row]={
                        q: tile+this.karte[row].offset,
                        r: row,
                        blocked: this.blocked[index],
                        landschaft: null,
                        zahl: null,
                        raeuber: null
                    };
                    index++;
            }   

        var landschaftsfelder=[];
        for(let key in this.landschaften)
            for(let i=0;i<this.landschaften[key];i++)
                landschaftsfelder.push(key)
        landschaftsfelder=shuffleArray(landschaftsfelder);

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

        index=0;
        spiral({q: 5,r: 1}, 2).forEach(feld => {
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

class view extends PIXI.Container{

    game;
    positions = new Map();;
    x;
    y;
    temp_graphics = new PIXI.Graphics();

    constructor(game){
        super();
        this.game=game;
    }    

    drawGame(){
        var hex_x = getHexSize(size).x, hex_y = getHexSize(size).y;

        //index der längsten reihe
        var _index = 0, index = 0;
        this.game.karte.forEach(reihe => {
            if(reihe.size>this.game.karte[_index].size)
                _index=index;
            index++;
        });

        this.x = ((app.screen.width-hex_x*this.game.karte[_index].size)+hex_x*(-(_index)-2*this.game.karte[_index].offset)+hex_x)/2;
        this.y = ((app.screen.height-hex_y*(this.game.karte.length*3/4+1/4))+hex_y)/2;

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

                var x=this.x+hexToPixel(hex).x;
                var y=this.y+hexToPixel(hex).y;

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
                g.hitArea = new PIXI.Polygon(getHex(x, y, size, true));
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
                    if(!g.marked&&marked_tiles.length<3){
                        g.tint = 0x333333;
                        g.marked = true;
                        marked_tiles.push({q: g.q,r: g.r});
                    }
                    else{
                        g.tint = 0x666666;
                        g.marked = false;
                        marked_tiles = marked_tiles.filter(tile => !(tile.q==g.q&&tile.r==g.r));
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
        if(areNeighbours(marked_tiles)&&isFree(marked_tiles)){
            switch(marked_tiles.length){
                case 2:
                    this.temp_graphics = this.drawStrasse({id: spieler_}, marked_tiles);
                    break;
                case 3:
                    this.temp_graphics = this.drawKreuzung({id: spieler_, stadt: stadt_}, marked_tiles);
                    break;
            }
        }
    }

}

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

var stadt_=false;
var spieler_=0;
var marked_tiles = [];
var position=[];
var size=50;

app.view.id = "pixijs";

var map=document.getElementById('map');
map.appendChild(app.view);

var game_ = new game();
var view_ = new view(game_);

function redraw(){
    app.stage.removeChild(view_);
    view_ = new view(game_);
    view_.drawGame();
    app.stage.addChild(view_);
}

redraw();

let count = 0;
app.ticker.add(() => {
    count += 0.01;
});

map.addEventListener('mouseover', e => {
    map.style.cursor = 'crosshair';
});

document.getElementById('bauen').addEventListener('click', e => {
    buildMarkedTiles();
    marked_tiles = [];
});

document.getElementById('loeschen').addEventListener('click', e => {
    game_.wege_bauen = new Map();
    game_.kreuzungen_bauen = new Map();
    marked_tiles = [];
});

document.getElementById('stadt').addEventListener('click', e => {
    document.getElementById('stadt').innerText=stadt_?'Siedlung':'Stadt';
    marked_tiles = [];
    stadt_=!stadt_;
    redraw();
});

document.getElementById('spieler').addEventListener('click', e => {
    marked_tiles = [];
    spieler_++;
    spieler_=spieler_%4;
    document.getElementById('spieler').innerText=spieler_;
    redraw()
});

function buildMarkedTiles(){
    if(areNeighbours(marked_tiles))
    switch(marked_tiles.length){
        case 2:
            if(isFree(marked_tiles)){
                game_.wege_bauen.set(marked_tiles, {id: spieler_});
                redraw();
                marked_tiles = [];
            }
            else
            temp_graphics.clear();
            break;
        case 3:
            if(isFree(marked_tiles)){
                game_.kreuzungen_bauen.set(marked_tiles, {id: spieler_, stadt: stadt_});
                redraw();
                marked_tiles = [];
            }
            else
            temp_graphics.clear();
            break;
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

function hasAll(array, tiles){
    let a = true;
    tiles.forEach(t => {
        if(!has(array, t))
            a = false;
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
                    if((areNeighbours([keys[0],tiles[0]])&&areNeighbours([keys[1],tiles[0]]))||(areNeighbours([keys[0],tiles[1]])&&areNeighbours([keys[1],tiles[1]])))
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
                    if((areNeighbours([keys[0],tiles[0]])&&areNeighbours([keys[1],tiles[0]]))||(areNeighbours([keys[0],tiles[1]])&&areNeighbours([keys[1],tiles[1]])))
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

function isEqual(hex_0, hex_1){
    return hex_0.q==hex_1.q&&hex_0.r==hex_1.r;
}

function pixelToHex(x, y, size){
    var q = (Math.sqrt(3)/3*x-1/3*y)/size;
    var r = (2/3*y)/size;
    return axialRound({
        q: q,
        r: r
    });
}

function hexToPixel(hex){
    return {
        x: size * (Math.sqrt(3) * hex.q  +  Math.sqrt(3)/2 * hex.r),
        y: size * (                                   3./2 * hex.r)
    };
}

function axialToCube(axial){
    return {
        q: axial.q,
        r: axial.r,
        s: -axial.q-axial.r
    };
}

function cubeToAxial(cube){
    return {
        q: cube.q,
        r: cube.r
    };
}

function cubeRound(frac){
    var q = Math.round(frac.q), r = Math.round(frac.r), s = Math.round(frac.s);
    var dq = Math.abs(q - frac.q), dr = Math.abs(r - frac.r), ds = Math.abs(s - frac.s);

    if(dq>dr&&dq>ds)
        q=-r-s;
    else if(dr>ds)
        r=-q-s;
    else    
        s=-q-r;

    return {
        q: q,
        r: r,
        s: s
    };
}

function axialRound(frac){
    return cubeToAxial(cubeRound(axialToCube(frac)));
}

function areNeighbours(tiles){
    if(tiles.length<2)
        return -1;
    let a = true;
    tiles.forEach(t0 => {
        tiles.forEach(t1 => {
            if(!neighbours(t0, t1)&&t1!=t0)
                a = false;
        });
    });
    return a;
}

function neighbour(hex, i){
    var vectors = [
        [-1, 0], [-1, 1], [0, 1], 
        [1, 0], [1, -1], [0, -1]
    ];
    return {q: hex.q+vectors[i][0], r: hex.r+vectors[i][1]};
}

function neighbours(t0, t1){
    var vectors = [
        [-1, 0], [-1, 1], [0, 1], 
        [1, 0], [1, -1], [0, -1]
    ];
    for(var i=0;i<vectors.length;i++)
        if((t0.q+vectors[i][0]==t1.q&&t0.r+vectors[i][1]==t1.r))
            return true;
    return false;
}

function ring(start, radius){
    var results = [];
    for(let i=0;i<6;i++)
        for(let o=0;o<radius-(i==5);o++){
            results.push(start);
            start=neighbour(start, i);
        }
        results.push(start)
    return results;
}

function spiral(start, radius){
    var results = [];

    for(let i=radius;i>0;i--){
        results=results.concat(ring({q: start.q,r: start.r}, i));
        start.q-=1;
        start.r+=1;
    }
    results=results.concat({q: start.q,r: start.r});
    return results;

}

function getHexSize(size){
    return {
        x: Math.sqrt(3) * size,
        y: 2 * size
    };
}

function getHex(x, y, size, pointy){
    var array=[];
    for(var i=0;i<6;i++){
        let c=getHexCorner(x, y, size, i, pointy)
        array.push(c.x);
        array.push(c.y)
    }
    return array;
}

function getHexCorner(x, y, size, i, pointy){
    var angle_deg = 60 * i - (pointy?30:0);
    var angle_rad = Math.PI / 180 * angle_deg;
    return {
        x: x + size * Math.cos(angle_rad),
        y: y + size * Math.sin(angle_rad)
    };
}