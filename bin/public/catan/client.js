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

    blocked = [
        {q: 3, r: 0},{q: 4, r: 0},{q: 5, r: 0},{q: 6, r: 0},
        {q: 2, r: 1},{q: 6, r: 1},
        {q: 1, r: 2},{q: 6, r: 2},
        {q: 0, r: 3},{q: 6, r: 3},
        {q: 0, r: 4},{q: 5, r: 4},
        {q: 0, r: 5},{q: 4, r: 5},
        {q: 0, r: 6},{q: 1, r: 6},{q: 2, r: 6},{q: 3, r: 6}
    ];

    farben_spieler = [
        0xFF0000,
        0x0000FF,
        0xCCCCCC,
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

    landschaften={ 
        "wald": 4,
        "huegelland": 3,
        "weideland": 4,
        "ackerland": 4,
        "gebirge": 3,
        "wueste": 1
    };

    karte_landschaften = new Array();

    kreuzungen = new Map();
    wege = new Map();

    kreuzungen_bauen = new Map();
    wege_bauen = new Map();

    constructor(){
        var karte_landschaften=[];
        for(let key in this.landschaften){
            for(let i=0;i<this.landschaften[key];i++)
                karte_landschaften.push(key)
        }
        this.karte_landschaften=shuffleArray(karte_landschaften);
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

var stadt_=false;
var spieler_=0;
var marked_tiles = [];
var temp_graphics = new PIXI.Graphics();
var position=[];
var size=50;

app.view.id = "pixijs";

var map=document.getElementById('map');
map.appendChild(app.view);

var container = new PIXI.Container();
var game_ = new game();

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
});

document.getElementById('loeschen').addEventListener('click', e => {
    game_.wege_bauen = new Map();
    game_.kreuzungen_bauen = new Map();
    redraw();
    marked_tiles = [];
});

document.getElementById('stadt').addEventListener('click', e => {
    document.getElementById('stadt').innerText=stadt_?'Siedlung':'Stadt';
    stadt_=!stadt_;
    drawMarkedTiles();
});

document.getElementById('spieler').addEventListener('click', e => {
    spieler_++;
    spieler_=spieler_%4;
    document.getElementById('spieler').innerText=spieler_;
    drawMarkedTiles();
});

function redraw(){
    app.stage.removeChild(container);
    container = new PIXI.Container();
    drawGame(container, game_);
    app.stage.addChild(container);
}

function drawGame(container, game){

    var x=0,y=0;
    var hex_x = getHexSize(size).x, hex_y = getHexSize(size).y;
    var landschaft=0;

    //index der längsten reihe
    var _index = 0, index = 0;
    game.karte.forEach(reihe => {
        if(reihe.size>game.karte[_index].size)
            _index=index;
        index++;
    });

    x += (app.screen.width-hex_x*game.karte[_index].size)/2+hex_x*(-(_index)/2-game.karte[_index].offset);
    y += (app.screen.height-hex_y*(game.karte.length*3/4+1/4))/2;

    var o = 0;
    game.karte.forEach(reihe => {
        for(var i=0;i<reihe.size;i++){
            var hex = {
                q: q=i+reihe.offset,
                r: r=o
            };
            
            if(!position[hex.q])
                position[hex.q]=[];

            position[hex.q][hex.r]={
                x: x+hex_x*(i+1/2*o+reihe.offset+1/2),
                y: y+hex_y*(3/4*o+1/2)
            };

            let g = new graphics(hex.q, hex.r);
            if(!has(game.blocked, hex)){
                g.beginFill(game.farben_landschaften[game.karte_landschaften[landschaft]], 0.6);
                landschaft++;
            }
            else
                g.beginFill(0xFFFFFF, 0.5);
            g.drawRegularPolygon(x+hex_x*(i+1/2*o+reihe.offset+1/2), y+hex_y*(3/4*o+1/2), size, 6, 0);
            g.hitArea = new PIXI.Polygon(getHex(x+hex_x*(i+1/2*o+reihe.offset+1/2), y+hex_y*(3/4*o+1/2), size, true));
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
                drawMarkedTiles()
            });
            g.endFill();
            container.addChild(g);
            let g_ = new PIXI.Graphics();
            g_.lineStyle(4, 0xFFFFFF);
            g_.drawRegularPolygon(x+hex_x*(i+1/2*o+reihe.offset+1/2), y+hex_y*(3/4*o+1/2), size, 6, 0);
            if(!has(game.blocked, hex))
                container.addChild(g_);
        }
        o++;
    });

    game.wege_bauen.forEach((value, key) => {
        drawStrasse(value, key);
    });

    game.wege.forEach((value, key) => {
        drawStrasse(value, key);
    });
    
    game.kreuzungen_bauen.forEach((value, key) => {
        drawKreuzung(value, key);
    });

    game.kreuzungen.forEach((value, key) => {
        drawKreuzung(value, key);
    });
}

function drawStrasse(value, key){
    x=(position[key[0].q][key[0].r].x-position[key[1].q][key[1].r].x)/10;
    y=(position[key[0].q][key[0].r].y-position[key[1].q][key[1].r].y)/10;

    let graphics = new PIXI.Graphics();
    graphics.position.x=(position[key[0].q][key[0].r].x+position[key[1].q][key[1].r].x)/2;
    graphics.position.y=(position[key[0].q][key[0].r].y+position[key[1].q][key[1].r].y)/2;
    graphics.lineStyle(4, 0xFFFFFF);
    graphics.beginFill(game_.farben_spieler[value.id], 1);
    graphics.drawCircle(-x, -y, size/16);
    graphics.drawCircle(x, y, size/16);
    graphics.lineStyle(10, 0xFFFFFF);
    graphics.moveTo(-x, -y)
    graphics.lineTo(x, y);
    graphics.lineStyle(4, game_.farben_spieler[value.id]);
    graphics.moveTo(-x, -y)
    graphics.lineTo(x, y);
    graphics.rotation=Math.PI/180*90;
    container.addChild(graphics);

    return graphics;
}

function drawKreuzung(value, key){
    var pos={
        x: 0,
        y: 0
    };
    key.forEach(e => {
        pos.x+=position[e.q][e.r].x;
        pos.y+=position[e.q][e.r].y;
    });

    let graphics = new PIXI.Graphics();
    graphics.lineStyle(4, 0xFFFFFF);
    graphics.beginFill(game_.farben_spieler[value.id], 1);
    graphics.drawRegularPolygon(pos.x/3, pos.y/3, size*(value.stadt?1/5:1/6), 6, value.stadt*Math.PI/180*30);
    graphics.endFill();
    container.addChild(graphics);

    return graphics;
}

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

function drawMarkedTiles(){
    temp_graphics.clear();
    if(areNeighbours(marked_tiles)&&isFree(marked_tiles)){
        switch(marked_tiles.length){
            case 2:
                temp_graphics = drawStrasse({id: spieler_}, marked_tiles);
                break;
            case 3:
                temp_graphics = drawKreuzung({id: spieler_, stadt: stadt_}, marked_tiles);
                break;
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

    if(tiles.length&&!hasAll(game_.blocked, tiles))
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

//pointy TODO: pointy and fat boolean
function pixelToHex(x, y, size){
    var q = (Math.sqrt(3)/3*x-1/3*y)/size;
    var r = (2/3*y)/size;
    return axialRound({
        q: q,
        r: r
    });
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

function neighbours(t0, t1){
    var vectors = [
        [1, 0], [1, -1], [0, -1], 
        [-1, 0], [-1, 1], [0, 1]
    ];
    for(var i=0;i<vectors.length;i++)
        if((t0.q+vectors[i][0]==t1.q&&t0.r+vectors[i][1]==t1.r))
            return true;
    return false;
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