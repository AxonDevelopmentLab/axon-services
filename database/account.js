const mongoose = require('mongoose');
const scheme = new mongoose.Schema({
    ID: String,
    Username: String,
    Password: String,
    Token: String,
    LoginAttempts: Array,
    Details: Object
});

module.exports = mongoose.model('accounts', scheme);