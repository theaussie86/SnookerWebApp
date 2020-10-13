const mongoose = require('mongoose');

var breakSchema = new mongoose.Schema({
    mitID: Number,
    datum: {
        type: Date,
        default: Date.now(),
    },
    player: {
        type: String,
        required: true
    },
    break: {
        type: Number,
        required: true
    },
    remark: String,
    _member: mongoose.Schema.Types.ObjectId
});

var Break = mongoose.model('Break',breakSchema);

module.exports = {Break};