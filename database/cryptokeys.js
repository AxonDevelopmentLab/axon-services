const mongoose = require('mongoose');
const scheme = new mongoose.Schema({
  Service: String,
  CryptographyKey: String,
  ScriptIVs: Array
});

module.exports = mongoose.model('axonlab.cryptokeys', scheme);