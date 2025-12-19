module.exports = class hex {

    vectors= [
        [-1, 0], [-1, 1], [0, 1], 
        [1, 0], [1, -1], [0, -1]
    ]

    isEqual(hex_0, hex_1){
        return hex_0.q==hex_1.q&&hex_0.r==hex_1.r;
    }

    pixelToHex(x, y, size){
        var q = (Math.sqrt(3)/3*x-1/3*y)/size;
        var r = (2/3*y)/size;
        return this.axialRound({
            q: q,
            r: r
        });
    }

    hexToPixel(hex, size){
        return {
            x: size * (Math.sqrt(3) * hex.q  +  Math.sqrt(3)/2 * hex.r),
            y: size * (                                   3./2 * hex.r)
        };
    }

    axialToCube(axial){
        return {
            q: axial.q,
            r: axial.r,
            s: (-axial.q-axial.r)
        };
    }

    cubeToAxial(cube){
        return {
            q: cube.q,
            r: cube.r
        };
    }

    cubeRound(frac){
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

    axialRound(frac){
        return this.cubeToAxial(this.cubeRound(this.axialToCube(frac)));
    }

    areNeighbours(tiles){
        if(tiles.length<2)
            return -1;
        let a = true;
        tiles.forEach(t0 => {
            tiles.forEach(t1 => {
                if(!this.neighbours(t0, t1)&&t1!=t0)
                    a = false;
            });
        });
        return a;
    }

    neighbour(hex, i){
        return {q: hex.q+this.vectors[i][0], r: hex.r+this.vectors[i][1]};
    }

    neighbours(t0, t1){
        for(var i=0;i<this.vectors.length;i++)
            if(
                this.neighbour(t0,i).q==t1.q
                &&
                this.neighbour(t0,i).r==t1.r
            )
                return true;
        return false;
    }

    rotate(hex, center, i){
        if(i===undefined){
            hex=this.axialToCube(hex);
            center=this.axialToCube(center);
            hex.q=hex.q-center.q;
            hex.s=hex.s-center.s;
            hex.r=hex.r-center.r;
            return this.cubeToAxial({
                q: (-hex.s+center.q),
                r: (-hex.q+center.r),
                s: (-hex.r+center.s)
            });
        }
        for(var o=0;o<i;o++)
            hex=this.rotate(hex, center);

        return hex;
    }

    ring(start, radius){
        var results = [];
        for(let i=0;i<6;i++)
            for(let o=0;o<radius-(i==5);o++){
                results.push(start);
                start=this.neighbour(start, i);
            }
            results.push(start)
        return results;
    }

    spiral(start, radius){
        var results = [];

        for(let i=radius;i>0;i--){
            results=results.concat(this.ring({q: start.q,r: start.r}, i));
            start.q-=1;
            start.r+=1;
        }
        results=results.concat({q: start.q,r: start.r});
        return results;

    }

    getHexSize(size){
        return {
            x: Math.sqrt(3) * size,
            y: 2 * size
        };
    }

    getHex(x, y, size, pointy){
        var array=[];
        for(var i=0;i<6;i++){
            let c=this.getHexCorner(x, y, size, i, pointy)
            array.push(c.x);
            array.push(c.y)
        }
        return array;
    }

    getHexCorner(x, y, size, i, pointy){
        var angle_deg = 60 * i - (pointy?30:0);
        var angle_rad = Math.PI / 180 * angle_deg;
        return {
            x: x + size * Math.cos(angle_rad),
            y: y + size * Math.sin(angle_rad)
        };
    }

}