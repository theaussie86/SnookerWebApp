const localStrategy = require('passport-local').Strategy;
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const {User} = require('../models/user');
const {passport, validator} = require('../server');

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
                if (!user) return done(null, false, req.flash('error_msg','Benutzer nicht gefunden'));
                if (!bcrypt.compareSync(password, user.password)) return done(null, false, req.flash('error_msg', 'Password ist falsch. Versuchen Sie es erneut.'));
                if (!user.Aktiv) return done(null, false, req.flash('error_msg', 'Sie sind kein aktives Mitglied mehr. Melden Sie sich wieder an.'));
                if (user.tokens.length > 0) {
                    User.find({username: user.username}).remove({'access':'auth'}).exec();
                }
                
                user.generateAuthToken();
                return done(null, user,req.flash('success_msg','Du hast dich erfolgreich eingeloggt.'));
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
                        return done(null, false, req.flash('error_msg', 'Der Benutzername ist schon vergeben.'));                        
                    } else {
                        return done(null, false, req.flash('error_msg', 'Die Emailadresse ist schon vergeben.'));                        
                    }                    
                } else {
                    var body = _.pick(req.body, ['email','password','username']);
                    var newUser = new User(body);

                    newUser.save(function(err){
                        if (err) return done(err);
                        return done(null, newUser, req.flash('success_msg', 'Das Mitglied wurde erfolgreich registriert.'));
                    });

                }
            });
        });
    }));

}
