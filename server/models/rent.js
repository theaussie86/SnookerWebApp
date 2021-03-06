const mongoose = require('mongoose');

var Rent = mongoose.model('Rent',{
    _member: {
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref: "User"
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
    paid: Boolean,
    onlyGuests:{
        type: Boolean,
        default: false
    }
});

module.exports = {Rent};