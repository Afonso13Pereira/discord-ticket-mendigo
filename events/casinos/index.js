// events/casinos/index.js
const fs   = require('fs');
const path = require('path');

const casinos = {};

fs.readdirSync(__dirname)
  .filter(f => f.endsWith('.js') && f !== 'index.js')
  .forEach(f => {
    const mod = require(path.join(__dirname, f));
    casinos[mod.id] = mod;
  });

module.exports = casinos;
