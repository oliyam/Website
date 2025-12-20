const hex = new (require('../catan/hex.js'))();

const d = [
  [{q: 1, r: -1},
   {q: 0, r: 0}],
   
  [{q: -1, r: 1},
   {q: 0, r: 0}],
   
  [{q: 0, r: 0},
   {q: 1, r: -1}],
   
  [{q: 0, r: 0},
   {q: -1, r: 1}],
]
const strassen = new Map([
      [[
        {q:3,r:1},
        {q:3,r:2}
      ],
      {
          id: 0,
          first: true
      }],
      [[
        {q:3,r:2},
        {q:2,r:2}
      ],
      {
          id: 0,
          first: false
      }
      ],
      [[
        {q:3,r:1},
        {q:2,r:2}
      ],
      {
          id: 0,
          first: false
      }
      ],
      [[
        {q:2,r:2},
        {q:2,r:1}
      ],
      {
          id: 1,
          first: true
      }
      ],
      [[
        {q:2,r:2},
        {q:1,r:2}
      ],
      {
          id: 0,
          first: false
      }
      ]
    ]);

function get_lhs(){
  strassen.keys().forEach(s => {
    if(strassen.get(s).first)
      longest_paths(strassen.get(s).id, s, 0,[])
  });
}

var lhs = {
  0: 0,
  1: 0,
  2: 0,
  3: 0
}

function longest_paths(pid, st, cl, ck) {
    let current_length = ++cl
    let checked = ck
    strassen.keys().forEach(pot_nb => {
      if (
        strassen.get(pot_nb).id==pid
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
      )
        longest_paths(pid, pot_nb, current_length, checked=checked.push(st))
    });
    if(lhs[pid]<current_length)
      lhs[pid]=current_length
}

function is_nb(s0, s1) {
  for(var i=0;i<4;i++){
    let m2 = i%2==0 ? 1 : 0;
    let m3 = i%3==0 ? 1 : 0;
    if (s0[m2].q==s1[m3].q 
        && 
        s0[m2].r==s1[m3].r)
      return hex.areNeighbours(s0.concat(s1[(m3+1)%2]))
  }
  return false;
}

get_lhs();
console.log(lhs)