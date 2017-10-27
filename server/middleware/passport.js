const localStrategy = require('passport-local').Strategy;
const _ = require('lodash');
const {mongoose} = require('../db/mongoose');
const bcrypt = require('bcryptjs');
const {User} = require('../models/user');

module.exports = function(passport){

    passport.serializeUser((user, done)=>{
        done(null, user.id);
    });

    passport.deserializeUser((id, done)=>{
        User.findById(id, (err,user)=>{
            done(err, user);
        });
    });

    passport.use('login', new localStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    },function(req, username, password, done){
        process.nextTick(function(){
            User.findOne({'username': username}, function(err, user){
                if (err) return done(err);
                if (!user) return done(null, false, req.flash('loginMessage','Benutzer nicht gefunden'));
                if (!bcrypt.compareSync(password, user.password)) return done(null, false, req.flash('loginMessage', 'Password ist falsch. Versuchen Sie es erneut.'));
                if (!user.Aktiv) return done(null, false, req.flash('loginMessage', 'Sie sind kein aktives Mitglied mehr. Melden Sie sich wieder an.'));
                if (user.tokens.length > 0) {
                    User.find({username: user.username}).remove({'access':'auth'}).exec();
                }
                user.generateAuthToken();
                return done(null, user);
            });
        });
    }));

    passport.use('register', new localStrategy({
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    },
    function(req, username, password, done){
        process.nextTick(function(){
            User.findOne({$or: [
                {email: req.body.email},
                {username: username}
            ]}, function(err, user){
                if (err) return done(err);
                if (user){
                    if (user.username === username) {
                        console.log('Username ist schon vergeben');
                        return done(null, false, req.flash('registerMessage', 'Der Benutzername ist schon vergeben.'));                        
                    } else {
                        console.log('Email ist schon vergeben');
                        return done(null, false, req.flash('registerMessage', 'Die Emailadresse ist schon vergeben.'));                        
                    }                    
                } else {
                    var body = _.pick(req.body, ['email','password','username']);
                    var newUser = new User(body);

                    newUser.save(function(err){
                        if (err) throw err;
                        return done(null, newUser);
                    });

                }
            });
        });
    }));
}
