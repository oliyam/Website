const app = new PIXI.Application({
    width: 600, height: 600, transparent: true, antialias: true
});

app.view.className = "pixijs";

document.getElementById('everything').appendChild(app.view);

app.stage.interactive = true;
const graphics = new PIXI.Graphics();
graphics.beginStroke(0xffffff);
graphics.drawPolygon(getHex(app.screen.width/2, app.screen.width/2, 50));

app.stage.addChild(graphics);
const panda = PIXI.Sprite.from('/res/baustelle.png');
panda.anchor.set(0.5);
panda.x = app.screen.width/2;
panda.y = app.screen.height/2;

//app.stage.addChild(panda);
let count = 0;
app.ticker.add(() => {
    panda.scale.x = 0.1 + Math.sin(count) * 0.004;
    panda.scale.y = 0.1 + Math.cos(count) * 0.004;
    count += 0.1;
});

function drawHex(){

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