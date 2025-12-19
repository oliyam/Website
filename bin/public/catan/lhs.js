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

function get_lhs(){
  strassen.forEach(s => {
      longest_path(s,0,[])
  })
}

var lhs = []

function longest_paths(st, cl, ck) {
  let current_length = cl
  let checked = ck
  checked.push(st)
  strassen.keys().forEach(pot_nb => {
    if (is_nb(pot_nb))
      longest_paths(next, ++current_length, checked)
  });
  lhs.push(current_length)
}

function is_nb(s0, s1) {
  for(var tile=0;tile<2;tile++)
    if (s0.indexOf(s1[tile])!=-1)
      return hex.areNeighbours(s0.concat(s1[(tile+1)%2]))
  return false;
}

get_lhs();
console.log(lhs)