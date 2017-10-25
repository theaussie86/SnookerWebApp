const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

const contactSchema = new mongoose.Schema({
    contactType: String,
    contactValue: String
});

const membershipSchema = new mongoose.Schema({
    MembershipType : String,
    MembershipFee: Number,
    MembershipStart: {
        type : Date,
        default : Date.now
    },
    MembershipEnd: Date
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
    tokens: [{
        access: {
            type: String,
            required: true
        },
        token:{
            type: String,
            required: true
        }
    }],
    Aktiv: {
        type: Boolean,
        required: true,
        default: true
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
    contacts: [contactSchema],
    memberships:[membershipSchema],
    mitID: Number
});

UserSchema.methods.toJSON = function() {
    var user = this;
    var userObject = user.toObject();

    return _.pick(userObject,['_id','username','email']);
};

UserSchema.methods.generateAuthToken = function() {
    var user = this;
    var access = 'auth';
    var token = jwt.sign({_id: user._id.toHexString(), access}, process.env.JWT_SECRET).toString();

    user.tokens.push({access, token});

    return user.save().then(() => {
        return token;
    });
};

UserSchema.methods.removeByToken = function(token){
    var user = this;

    return user.update({
        $pull: {
            tokens: {token}
        }
    });
};

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

UserSchema.statics.findByToken = function (token){
    var User = this;
    var decoded;

    try {
        decoded=jwt.verify(token,process.env.JWT_SECRET);
    } catch (err) {
        return Promise.reject();
    }

    return User.findOne({
        '_id': decoded._id,
        'tokens.token': token,
        'tokens.access':'auth'
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