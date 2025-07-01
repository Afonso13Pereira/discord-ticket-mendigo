const fs = require('fs');
const path = require('path');

function load(file) {
  const p = path.join(__dirname, '..', file);
  if (!fs.existsSync(p)) fs.writeFileSync(p, '{}');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
function save(file, obj) {
  const p = path.join(__dirname, '..', file);
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
}
module.exports = { load, save };
