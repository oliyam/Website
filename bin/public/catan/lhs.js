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
      {id: 0}],
      [[
        {q:3,r:2},
        {q:2,r:2}
      ],
      {id: 0}
      ],
      [[
        {q:3,r:1},
        {q:2,r:2}
      ],
      {id: 0}
      ],
      [[
        {q:2,r:2},
        {q:2,r:1}
      ],
      {id: 0}
      ],
      [[
        {q:2,r:2},
        {q:1,r:2}
      ],
      {id: 0}
      ]
    ]);

function get_lhs(player_id){
  strassen.keys().forEach(s => {
      if (strassen.get(s).id==player_id)
        longest_paths(s,0,[])
  })
}

var lhs = []

function longest_paths(st, cl, ck) {
  let current_length = cl
  let checked = ck
  checked.push(st)
  strassen.keys().forEach(pot_nb => {
    if (is_nb(pot_nb, st))
      longest_paths(pot_nb, ++current_length, checked)
  });
  lhs.push(current_length)
}

function is_nb(s0, s1) {
  for(var i=0;i<4;i++){
    m2 = i%2==0 ? 1 : 0;
    m3 = i%3==0 ? 1 : 0;
    if (s0[m2].q==s1[m3].q 
        && 
        s0[m2].r==s1[m3].r)
      return hex.areNeighbours(s0.concat(s1[(m2+1)%2]))
  }
  return false;
}

get_lhs(0);
console.log(lhs)