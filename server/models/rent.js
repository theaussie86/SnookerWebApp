const mongoose = require('mongoose');

var Rent = mongoose.model('Rent',{
    _member: {
        type: mongoose.Schema.Types.ObjectId,
        // required:true
    },
    mitID: Number,
    datum: Date,
    player1: {
        type: String,
        required: true
    },
    player2: String,
    start: Date,
    ende: Date,
    paid: Boolean
});

module.exports = {Rent};