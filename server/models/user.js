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
    membershipType : String,
    membershipFee: Number,
    membershipStart: {
        type : Date,
        default : Date.now
    },
    membershipEnd: Date
});

const billSchema = new mongoose.Schema({
    billDate : Date,
    membershipFee: Number,
    feePaid: Boolean,
    visitorsSales: Number,
    salesPaid: Boolean,
    billRents:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "rents"
    }]
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
    contacts: [contactSchema],
    memberships:[membershipSchema],
    bills:[billSchema],
    mitID: Number
});

UserSchema.methods.toJSON = function() {
    var user = this;
    var userObject = user.toObject();

    return _.pick(userObject,['_id','username','email']);
};

// UserSchema.methods.generateAuthToken = function() {
//     var user = this;
//     var access = 'auth';
//     var token = jwt.sign({_id: user._id.toHexString(), access}, process.env.JWT_SECRET).toString();

//     user.tokens.push({access, token});

//     return user.save();//.then(() => {
//     //     return token;
//     // });
// };

// UserSchema.methods.removeTokens = function(){
//     var user = this;

//     return user.update({
//         $pull: {
//             tokens: {}
//         }
//     });
// };

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

// UserSchema.statics.findByToken = function (token){
//     var User = this;
//     var decoded;

//     try {
//         decoded=jwt.verify(token,process.env.JWT_SECRET);
//     } catch (err) {
//         return Promise.reject();
//     }

//     return User.findOne({
//         '_id': decoded._id,
//         'tokens.token': token,
//         'tokens.access':'auth'
//     });
// };

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