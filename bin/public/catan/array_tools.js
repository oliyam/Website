module.exports = class{

    shuffleArray(array){
        if(Array.isArray(array)){
            for(var i=array.length-1;i>0;i--){
                let j=Math.floor(Math.random()*i+1);
                this.swapArray(array,i,j);
            }
        return array;
        }
        return -1;
    }

    swapArray(array,i,j){
        if(Array.isArray(array)&&i>=0&&j>=0&&i<array.length&&j<array.length){
            let tmp=array[i];
            array[i]=array[j];
            array[j]=tmp;
            return array;
        }
        return -1;
    }

}