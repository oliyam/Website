const app = new PIXI.Application({
    width: 1000, height: 1000, backgroundAlpha: 0, antialias: true
});

app.view.id = "pixijs";

document.getElementById('map').appendChild(app.view);
document.getElementById('map').scrollTo({
    left: (app.screen.width-document.getElementById('map').clientWidth)/2,
    top: (app.screen.height-document.getElementById('map').clientHeight)/2,
    behaviour: 'smooth'
});

const container = new PIXI.Container();
container.interactive = true;

const graphics = new PIXI.Graphics();
graphics.lineStyle(4, 0xFFFFFF);
//graphics.drawPolygon(getHex(app.screen.width/2, app.screen.width/2, 50));
drawHexMap(graphics, 0, 0, 50) 
graphics.endFill();
container.addChild(graphics);
app.stage.addChild(container)

//app.stage.addChild(panda);
let count = 0;
app.ticker.add(() => {

    count += 0.01;
});


function drawHexMap(graphics, x, y, size){
    var karte = [
        {size: 3, offset: 0},
        {size: 4, offset: 0},
        {size: 5, offset: 0},
        {size: 4, offset: 1},
        {size: 3, offset: 2}
    ];
    var o = 0;
    var hex_x = getHexSize(size).x, hex_y = getHexSize(size).y;

    //index der längsten reihe
    var _index = 0, index = 0;
    karte.forEach(reihe => {
        if(reihe.size>karte[_index].size)
            _index=index;
        index++;
    });

    x += (app.screen.width-hex_x*karte[_index].size)/2+hex_x*((_index)/2-karte[_index].offset);
    y += (app.screen.height-hex_y*(karte.length*3/4+1/4))/2;

    karte.forEach(reihe => {
        for(var i=0;i<reihe.size;i++){
            graphics.lineStyle(4, 0xFFFFFF);
            graphics.drawRegularPolygon(x+hex_x*(i-1/2*o+reihe.offset+1/2), y+hex_y*(3/4*o+1/2), size, 6, 0)
            graphics.beginFill(0x00FF00, 0.5);
            graphics.drawRegularPolygon(x+hex_x*(i-1/2*o+reihe.offset+1/2), y+hex_y*(3/4*o+1/2), size, 6, 0) 
            graphics.endFill();
        }
        o++;
    });
}

function getHexSize(size){
    return {
        x: Math.sqrt(3) * size,
        y: 2 * size
    };
}

function getHex(x, y, size){
    var array=[];
    for(var i=0;i<6;i++){
        let c=getHexCorner(x, y, size, i)
        array.push(c.x);
        array.push(c.y)
    }
    return array;
}

function getHexCorner(x, y, size, i){
    var angle_deg = 60 * i - 30;
    var angle_rad = Math.PI / 180 * angle_deg;
    return {
        x: x + size * Math.cos(angle_rad),
        y: y + size * Math.sin(angle_rad)
    };
}