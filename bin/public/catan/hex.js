export var vectors = [
    [-1, 0], [-1, 1], [0, 1], 
    [1, 0], [1, -1], [0, -1]
];

export function isEqual(hex_0, hex_1){
    return hex_0.q==hex_1.q&&hex_0.r==hex_1.r;
}

export function pixelToHex(x, y, size){
    var q = (Math.sqrt(3)/3*x-1/3*y)/size;
    var r = (2/3*y)/size;
    return axialRound({
        q: q,
        r: r
    });
}

export function hexToPixel(hex, size){
    return {
        x: size * (Math.sqrt(3) * hex.q  +  Math.sqrt(3)/2 * hex.r),
        y: size * (                                   3./2 * hex.r)
    };
}

export function axialToCube(axial){
    return {
        q: axial.q,
        r: axial.r,
        s: -axial.q-axial.r
    };
}

export function cubeToAxial(cube){
    return {
        q: cube.q,
        r: cube.r
    };
}

export function cubeRound(frac){
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

export function axialRound(frac){
    return cubeToAxial(cubeRound(axialToCube(frac)));
}

export function areNeighbours(tiles){
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

export function neighbour(hex, i){
    return {q: hex.q+vectors[i][0], r: hex.r+vectors[i][1]};
}

export function neighbours(t0, t1){
    for(var i=0;i<vectors.length;i++)
        if((t0.q+vectors[i][0]==t1.q&&t0.r+vectors[i][1]==t1.r))
            return true;
    return false;
}

export function ring(start, radius){
    var results = [];
    for(let i=0;i<6;i++)
        for(let o=0;o<radius-(i==5);o++){
            results.push(start);
            start=neighbour(start, i);
        }
        results.push(start)
    return results;
}

export function spiral(start, radius){
    var results = [];

    for(let i=radius;i>0;i--){
        results=results.concat(ring({q: start.q,r: start.r}, i));
        start.q-=1;
        start.r+=1;
    }
    results=results.concat({q: start.q,r: start.r});
    return results;

}

export function getHexSize(size){
    return {
        x: Math.sqrt(3) * size,
        y: 2 * size
    };
}

export function getHex(x, y, size, pointy){
    var array=[];
    for(var i=0;i<6;i++){
        let c=getHexCorner(x, y, size, i, pointy)
        array.push(c.x);
        array.push(c.y)
    }
    return array;
}

export function getHexCorner(x, y, size, i, pointy){
    var angle_deg = 60 * i - (pointy?30:0);
    var angle_rad = Math.PI / 180 * angle_deg;
    return {
        x: x + size * Math.cos(angle_rad),
        y: y + size * Math.sin(angle_rad)
    };
}