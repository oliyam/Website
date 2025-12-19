const hex = new (require('../catan/hex.js'))();

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

function longest_path(st, cl, ck) {
  let current_longest = cl
  let checked = ck
  checked.push(st)
  for(n in hex.areNeighbours(st)){
    if (checked.indexOf(n)==-1)
      longest_path(a, ++current_longest, checked)
  }
  lhs.push(current_longest)
}

get_lhs();
console.log(lhs)