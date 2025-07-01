const { randomUUID } = require('crypto');
const { load, save } = require('./store');
const FILE = 'cats.json';
const cats = load(FILE);         // id → { name,color,emoji,active,created }

function create(name, color, emoji) {
  const id = randomUUID().slice(0, 8);
  cats[id] = { name, color, emoji, active: true, created: Date.now() };
  save(FILE, cats);
  return id;
}
function close(id) { if (cats[id]) { cats[id].active = false; save(FILE, cats); } }
function list()  { return Object.entries(cats).sort((a,b)=>b[1].created-a[1].created); }

module.exports = { cats, create, close, list };
