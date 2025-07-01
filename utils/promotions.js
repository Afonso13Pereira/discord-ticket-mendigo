const { randomUUID } = require('crypto');
const { load, save } = require('./store');
const FILE = 'promos.json';
const promos = load(FILE);   // id → { name,end,casino,color,emoji,active,created }

function create(name, endISO, casino, color, emoji) {
  const id = randomUUID().slice(0, 8);
  promos[id] = { name, end: endISO, casino, color, emoji, active: true, created: Date.now() };
  save(FILE, promos); return id;
}
function close(id){ if(promos[id]){ promos[id].active=false; save(FILE,promos);} }

function refreshExpired(){
  const now=Date.now(); let changed=false;
  for(const p of Object.values(promos)){
    if(p.active && now>new Date(p.end).getTime()){ p.active=false; changed=true; }
  }
  if(changed) save(FILE,promos);
}
function list(){ refreshExpired(); return Object.entries(promos).sort((a,b)=>b[1].created-a[1].created); }

module.exports={ promos, create, close, list, refreshExpired };
