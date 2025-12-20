module.exports = class lhs {
  
  hex = new (require('../catan/hex.js'))();
  
  lhs = {};
  
  get_per_player(sts){
    this.lhs = {
      0: 0,
      1: 0,
      2: 0,
      3: 0
    };
    sts.keys().forEach(s => {
      if(sts.get(s).first)
        this.longest_paths(sts, s, 0, [])
    });
    
    return this.lhs;
  }
  
  longest_paths(sts, st, cl, ck) {
      let pid = sts.get(st).id
      let current_length = ++cl
      let checked = ck
      if(this.lhs[pid]<current_length)
        this.lhs[pid]=current_length
        sts.keys().forEach(pot_nb => {
        if (
          pot_nb != st
          && 
          sts.get(pot_nb).id==pid
          && 
          !checked.includes(pot_nb)
          &&
          is_nb(pot_nb, st)
          &&
          !((ckd, pnb) => {
            let db = false;
            ckd.forEach(c => {
              if(is_nb(c, pnb))
                db = true;
            })
            return db;
          })(checked, pot_nb)
        ){
          checked.push(st)
          this.longest_paths(sts, pot_nb, current_length, checked)
        }
      });
  }
  
  is_nb(s0, s1) {
    for(var i=0;i<4;i++){
      let m2 = i%2==0 ? 1 : 0;
      let m3 = i%3==0 ? 1 : 0;
      if (s0[m2].q==s1[m3].q 
          && 
          s0[m2].r==s1[m3].r)
        return this.hex.areNeighbours(s0.concat(s1[(m3+1)%2]))
    }
    return false;
  }
  
}