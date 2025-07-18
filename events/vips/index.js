// events/vips/index.js
const fs   = require('fs');
const path = require('path');

const vips = {};

fs.readdirSync(__dirname)
  .filter(f => f.endsWith('.js') && f !== 'index.js')
  .forEach(f => {
    const mod = require(path.join(__dirname, f));
    vips[mod.id] = mod;
  });

module.exports = vips; 