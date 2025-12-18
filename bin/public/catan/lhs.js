const wege=new Map(
  [[
    {q:3,r:1},
    {q:2,r:2}
  ],
  {id: 0}],
  [[
    {q:3,r:2},
    {q:2,r:2}
  ],
  {id: 0}
  ],
  [[
    {q:1,r:1},
    {q:1,r:2}
  ],
  {id: 0}
  ]
);

function get_lhs(){
  players.forEach(p => {
    p.strassen.forEach(s => {
      s.angrenzende_strassen.forEach(a => {
        
      })
    })
  })
}

var lhs = []

function longest_path(strasse, cl=1, ck=[]) {
  let c = cl
  let checked = ck
  checked.push(strasse)
  for(a in angrenzende(strasse)){
    if (checked.indexOf(a)>=0)
      longest_path(a, ++c, checked)
  }
  lhs.push(c)
}