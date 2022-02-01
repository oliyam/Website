const app = new PIXI.Application({
    width: 600, height: 600, backgroundAlpha: 0, antialias: true
});

class game{
    karte = [
        {size: 3, offset: 2},
        {size: 4, offset: 1},
        {size: 5, offset: 0},
        {size: 4, offset: 0},
        {size: 3, offset: 0}
    ];
    kreuzungen = new Map();
    wege = new Map();

    constructor(){
        this.kreuzungen.set([
            {q: 2, r: 0},
            {q: 1, r: 1},
            {q: 2, r: 1},
        ], {id: 0, stadt: true});

        this.kreuzungen.set([
            {q: 1, r: 2},
            {q: 1, r: 1},
            {q: 2, r: 1},
        ], {id: 0, stadt: false});


        this.wege.set([
            {q: 2, r: 0},
            {q: 1, r: 1}
        ], {id: 0});
        this.wege.set([
            {q: 2, r: 1},
            {q: 1, r: 1}
        ], {id: 0});
    }
};

function drawGame(container, game){
    var size=50;
    var x=0,y=0;
    var hex_x = getHexSize(size).x, hex_y = getHexSize(size).y;

    var position=[];

    //index der längsten reihe
    var _index = 0, index = 0;
    game.karte.forEach(reihe => {
        if(reihe.size>game.karte[_index].size)
            _index=index;
        index++;
    });

    x += (600-hex_x*game.karte[_index].size)/2+hex_x*(-(_index)/2-game.karte[_index].offset);
    y += (600-hex_y*(game.karte.length*3/4+1/4))/2;

    var o = 0;
    game.karte.forEach(reihe => {
        for(var i=0;i<reihe.size;i++){
            var hex = {
                q: q=i+reihe.offset,
                r: r=o
            };
            console.log(q+" "+r)

            if(!position[hex.q])
                position[hex.q]=[];

            position[hex.q][hex.r]={
                x: x+hex_x*(i+1/2*o+reihe.offset+1/2),
                y: y+hex_y*(3/4*o+1/2)
            };

            let graphics = new PIXI.Graphics();
            graphics.lineStyle(4, 0xFFFFFF);
            graphics.beginFill(0x00FF00, 0.5);
            graphics.drawRegularPolygon(x+hex_x*(i+1/2*o+reihe.offset+1/2), y+hex_y*(3/4*o+1/2), size, 6, 0);
            graphics.endFill();
            container.addChild(graphics);
        }
        o++;
    });

    game.wege.forEach((value, key) => {
        console.log(key);
        let graphics = new PIXI.Graphics();
        graphics.position.x=(position[key[0].q][key[0].r].x+position[key[1].q][key[1].r].x)/2;
        graphics.position.y=(position[key[0].q][key[0].r].y+position[key[1].q][key[1].r].y)/2;
        x=(position[key[0].q][key[0].r].x-position[key[1].q][key[1].r].x);
        y=(position[key[0].q][key[0].r].y-position[key[1].q][key[1].r].y);
        graphics.lineStyle(10, 0xFFFFFF);
        graphics.moveTo(-x/4, -y/4)
        graphics.lineTo(x/4, y/4);
        graphics.lineStyle(4, 0xFF0000);
        graphics.moveTo(-x/4, -y/4)
        graphics.lineTo(x/4, y/4);
        graphics.rotation=Math.PI/180*90;
        container.addChild(graphics);
    });

    game.kreuzungen.forEach((value, key) => {
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
        graphics.beginFill(0xFF0000, 1);
        graphics.drawRegularPolygon(pos.x/3, pos.y/3, size*(value.stadt?1/5:1/6), 6, value.stadt*Math.PI/180*30);
        graphics.endFill();
        container.addChild(graphics);
    });
}

app.view.id = "pixijs";

var map=document.getElementById('map');
map.appendChild(app.view);

var container = new PIXI.Container();
var game_ = new game();
drawGame(container, game_);
app.stage.addChild(container);

map.addEventListener('mouseover', (e) => {
    map.addEventListener('mousemove', (e) => {
        app.stage.removeChild(container);
        container = new PIXI.Container();
        drawGame(container, game_);
        app.stage.addChild(container);
    });
});

let count = 0;
app.ticker.add(() => {
    count += 0.01;
});

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