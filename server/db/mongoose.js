const mongoose = require('mongoose');
const options = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true
}

mongoose.Promise = global.Promise;
mongoose.connection.openUri(process.env.MONGODB_URI, options);

module.exports = { mongoose };
