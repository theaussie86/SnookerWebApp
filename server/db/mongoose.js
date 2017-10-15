const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connection.openUri(process.env.MONGODB_URI);

module.exports = {mongoose};