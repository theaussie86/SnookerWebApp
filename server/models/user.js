const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

const membershipSchema = new mongoose.Schema({
    membershipType : String,
    membershipFee: Number,
    membershipStart: {
        type : Date,
        default : Date.now
    },
    membershipEnd: {
        type: Date,
        default: 0
    }
});

const billSchema = new mongoose.Schema({
    billDate : Date,
    membershipFee: Number,
    feePaid: {type:Boolean,default: false},
    visitorsSales: Number,
    salesPaid: {type:Boolean,default: false}
});

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        minlength: 1,
        trim: true,
        unique : true,
        validate: {
            validator: (value)=> {
                return validator.isEmail(value);
            },
            message: '${value} is not a valid email'
        }
    },
    handy: String,
    festnetz: String,
    password:{
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        minlength: 3,
        trim: true,
        unique : true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    aktiv: {
        type: Boolean,
        default: true
    },
    isBoardMember: {
        type: Boolean,
        default: false
    },
    firstname: {
        type : String,
        trim : true
    },
    lastname: {
        type : String,
        trim : true
    },
    street: {
        type : String,
        trim : true
    },
    zip: {
        type : String,
        length : 5
    },
    city: {
        type : String,
        trim : true
    },
    memberships:[membershipSchema],
    bills:[billSchema],
    DoB: Date,
    mitID: Number,
    bild: String
});

UserSchema.statics.findByCredentials = function(username,password){
 var User= this;

 return User.findOne({username}).then((user)=>{
    if (!user){
        return Promise.reject();
    }

    return new Promise((resolve, reject)=>{
        bcrypt.compare(password, user.password, (err, res)=>{
            if (res){
                resolve(user);
            } else{
                reject();
            }
        });
    });
 });
};

UserSchema.pre('save', function(next){
    var user = this;
    if (user.isModified('password')) {
        bcrypt.genSalt(13,(err, salt)=>{
            bcrypt.hash(user.password,salt,(err, hash) => {
                user.password=hash;
                next();
            });
        });
        
    } else {
        next();
    }

});

const User = mongoose.model('User', UserSchema);

module.exports = {User};