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
  for(a in hex.areNeighbours(st)){
    if (checked.indexOf(a)>=0)
      longest_path(a, ++current_longest, checked)
  }
  lhs.push(c)
}