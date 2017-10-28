require('./config/config');

const express = require('express');
const morgan = require('morgan');
const path = require('path');
const hbs = require('hbs');
const bodyParser = require('body-parser');
const session = require('express-session');
const {ObjectID}=require('mongodb');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const flash = require('connect-flash');
const passport = require('passport');
const MongoStore = require('connect-mongo')(session);
const nodemailer = require('nodemailer');
const async = require('async');
const crypto = require('crypto');
const validator = require('express-validator');

const publicPath = path.join(__dirname,'../public');
const {mongoose} = require('./db/mongoose');
const {User} = require('./models/user');
const {Rent} = require('./models/rent');
const {isLoggedIn, isAdmin} = require('./middleware/authenticate');

var app = express();

// Middleware
app.use(morgan('dev'));
app.use(session({
    secret: 'geileSnookerSession',
    saveUninitialized: false,
    resave: false,
    store: new MongoStore({
        mongooseConnection: mongoose.connection,
        ttl: 7*24*60*60,
        autoRemove:'native'
    })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());;

app.use(validator());

// Global Variables for flash
app.use((req, res, next)=>{
    res.locals.success_msg = req.flash('success_msg');
    res.locals.info_msg = req.flash('info_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.set('port', (process.env.PORT || 3000));
require('./middleware/passport')(passport);

app.set('views',publicPath+'/views');
hbs.registerPartials(publicPath+ '/views/partials');
app.set('view engine','hbs');

// app.use((req, res, next) => {
//     var now = new Date().toString();
//     var log = `${now}: ${req.method} ${req.url}`;

//     fs.appendFile('server.log',log + '\n', (err) => {
//         if (err) console.log('Unable to append to server.log.');
//     });
//     next();
// });

// app.use((req, res, next) => {
//     res.render('maintenance.hbs');
// });

app.use(express.static(publicPath));

hbs.registerHelper('getCurrentYear',() => {
    return new Date().getFullYear();
});

// Homepage
app.get('/', (req, res) =>{
    res.render('home.hbs',{
        title: 'Home',
        user: req.user,
        message: req.flash('loginMessage')
    });
});

// Login, Logout, Register, Reset

    // Login
        app.get('/login',(req,res)=>{
            
            res.render('login.hbs',{
                title: 'Login',
                user: req.user
            });
        });

        app.post('/login', CheckLoginForm, passport.authenticate('login',{
            successRedirect: '/members',
            failureRedirect: '/login',
            failureFlash: true
        }));

    // Logout
        app.get('/logout', isLoggedIn, (req, res)=>{
            req.user.removeTokens().then(()=>{
                req.logout()
                req.flash('success_msg','Sie haben sich erfolgreich ausgeloggt.');
                res.redirect('/');

                // req.session.destroy((err)=>{
                // });
            });
        });

    // Register
        app.get('/register', isAdmin, (req,res)=>{
            res.render('register.hbs',{
                title: 'Registrieren',
                user: req.user,
                'info_msg':'Das Passwort muss mindestens eine Ziffer und einen Buchstaben enthalten und mindestens 6 Zeichen lang sein.'                
            });
        });
        
        app.post('/register', CheckRegisterForm,passport.authenticate('register',{
            successRedirect: '/members',
            failureRedirect: '/register',
            failureFlash: true
        }));

    // Reset
        app.get('/forgot',(req,res)=>{
            res.render('forgot.hbs',{
                title: 'Passwort vergessen',
                user: req.user
            });
        });
        
        app.post('/forgot',(req,res,next)=>{
            req.checkBody('username','Das Eingabefeld darf nicht leer sein.').notEmpty();
            var errors = req.validationErrors();
            if (errors) {
                // Render the form using error information
                res.render('forgot.hbs',{errors: errors});
            }
            else {
               // There are no errors so perform action with valid data (e.g. save record).
            async.waterfall([
                function(done) {
                  crypto.randomBytes(20, function(err, buf) {
                    var token = buf.toString('hex');
                    done(err, token);
                  });
                },
                function(token, done) {
                  User.findOne({$or: [
                    {email: req.body.username},
                    {username: req.body.username}
                ]}, function(err, user) {
                    if (!user) {
                      req.flash('error_msg', 'Es existiert kein Benutzer mit '+req.body.username+'. Versuche es nochmal.');
                      return res.redirect('/forgot');
                    }
            
                    user.resetPasswordToken = token;
                    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
            
                    user.save(function(err) {
                      done(err, token, user);
                    });
                  });
                },
                function(token, user, done) {
                  var smtpTransport = nodemailer.createTransport({
                    service: 'gmail',
                    port: 25,
                    secure: false,
                    auth: {
                      user: 'snookertempel@gmail.com',
                      pass: 'Snooker180'
                    },
                    tls:{
                        rejectUnauthorized:false
                    }
                  });
                  var mailOptions = {
                    to: user.email,
                    from: 'snookertempel@gmail.com',
                    subject: 'Passwort zurück setzen!',
                    text: 'Du hast diese Email bekommen, weil du (oder jemand anderes) das Passwort für dein Account zurück setzen will.\n\n' +
                      'Bitte klicke auf den folgenden Link oder füge ihn in die Adresszeile deines Browsers ein, um den Prozess abzuschließen:\n\n' +
                      'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                      'Wenn du diese Anfrage nicht geschickt hast, ignoriere bitte diese Email und dein Password wird unverändert bleiben.\n\n'+
                      'Snookerclub Neubrandenburg'
                  };
                  smtpTransport.sendMail(mailOptions, function(err) {
                    req.flash('info_msg', 'Wir haben eine Email mit weiteren Anweisungen an '+user.email+' geschrieben.');
                    done(err, 'done');
                  });
                }
              ], function(err) {
                if (err) return next(err);
                res.redirect('/forgot');
              });
            }
        });
    

        app.get('/reset/:token',(req,res)=>{
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } },(er, user)=>{
                if (!user) {
                    req.flash('error','Password Reset Link ist ungültig oder abgelaufen.');
                    return res.redirect('/forgot');
                }

                res.render('reset.hbs', {
                    title: 'Passwort vergessen',
                    user: req.user,
                    'info_msg':'Das Passwort muss mindestens eine Ziffer und einen Buchstaben enthalten und mindestens 6 Zeichen lang sein.'
                });
        });
        });

        app.post('/reset/:token', function(req, res) {
            req.checkBody('password','Passwort darf nicht leer sein.').notEmpty();
            req.checkBody('password','Das Passwort muss mindestens eine Ziffer und einen Buchstaben enthalten und mindestens 6 Zeichen lang sein.')
            .matches(/^(?=.*\d)(?=.*[a-z])[0-9a-zA-Z]{6,}$/, "i");    
            req.checkBody('password2','Die Passwörter müssen überein stimmen.').equals(req.body.password);

            var errors = req.validationErrors();
            if (errors) {
                // Render the form using error information
                res.render('reset.hbs',{errors: errors});
            }
            else {
               // There are no errors so perform action with valid data (e.g. save record).
                       
            async.waterfall([
              function(done) {
                User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires:{ $gt: Date.now()}}, function(err, user) {
                  if (!user) {
                    req.flash('error', 'Der Link zum Zurücksetzen des Passworts ist ungültig.');
                    return res.redirect('/login');
                  }

                  user.password = req.body.password;
                  user.resetPasswordToken = undefined;
                  user.resetPasswordExpires = undefined;
          
                  user.save(function(err) {
                      done(err, user);                    
                  });
                });
              },
              function(user, done) {
                var smtpTransport = nodemailer.createTransport({
                    service: 'gmail',
                    port: 25,
                    secure: false,
                    auth: {
                      user: 'snookertempel@gmail.com',
                      pass: 'Snooker180'
                    },
                    tls:{
                        rejectUnauthorized:false
                    }
                  });
                  var mailOptions = {
                    to: user.email,
                    from: 'snookertempel@gmail.com',
                    subject: 'Dein Passwort wurde geändert',
                    text: 'Hallo,\n\n' +
                    'Das ist eine Bestätigung, dass das Passwort für dein Konto ' + user.email + ' geändert wurde.\n\n'+
                    'Snookerclub Neubrandenburg'
                    };
                smtpTransport.sendMail(mailOptions, function(err) {
                  req.flash('success_msg', 'Geschafft! Dein Passwort wurde geändert.');
                  done(err);
                });
              }
            ], function(err) {
              res.redirect('/login');
            });
        }
        });

    // Mitgliederseite
    app.get('/members',isLoggedIn, (req, res) =>{
        res.render('members.hbs',{
            title: 'Mitglieder',
            user: req.user
        });
    });
        
    app.get('/board', (req, res) =>{
        res.render('board.hbs',{
            title: 'Vorstand'
        });
    });

    app.get('/about', (req, res) =>{
        res.render('about.hbs',{
            title: 'Impressum'
        });
    });

    app.get('/maintenance', (req, res) =>{
        res.render('maintenance.hbs',{
            title: 'Wartung'
        });
    });

app.listen(app.get('port'), () => {
    console.log(`Server started on port ${app.get('port')}`);
});

module.exports = {app, passport, validator};

function CheckLoginForm(req, res, next){
    req.checkBody('username','Der Benutzername darf nicht leer sein.').notEmpty();
    req.checkBody('password','Das Passwort darf nicht leer sein.').notEmpty();
    
    
        var errors = req.validationErrors();
        if (errors) {
            // Render the form using error information
            res.render('login.hbs',{errors: errors});
        }
        else {
            // There are no errors so perform action with valid data (e.g. save record).
            next();
        }
}

function CheckRegisterForm(req, res, next){
    req.checkBody('username','Der Benutzername darf nicht leer sein.').notEmpty();
    req.checkBody('email','Bitte geben Sie eine Emailadresse an.').notEmpty();
    req.checkBody('password','Das Passwort darf nicht leer sein.').notEmpty();
    req.checkBody('password','Das Passwort muss mindestens eine Ziffer und einen Buchstaben enthalten und mindestens 6 Zeichen lang sein.')
        .matches(/^(?=.*\d)(?=.*[a-z])[0-9a-zA-Z]{6,}$/, "i");
    req.checkBody('password2','Die Passwörter müssen überein stimmen.').equals(req.body.password);
        
    
    
        var errors = req.validationErrors();
        if (errors) {
            // Render the form using error information
            res.render('register.hbs',{errors: errors});
        }
        else {
            // There are no errors so perform action with valid data (e.g. save record).
            next();
        }
}


// User routes
// app.get('/users', (req,res) => {
//     User.find().then((users) => {
//         res.send({users});
//     },(err) => {
//         res.status(400).send(err);
//     });
// });



// app.post('/register', (req,res) => {
//     var body = _.pick(req.body, ['email','password','username']);
//     var user = new User (body);

//     user.save().then(() => {
//         return user.generateAuthToken();
//     }).then(() =>{
//         res.render('members.hbs', {
//             title: 'Mitglieder',
//             user: user
//         });
//     }).catch((err)=>{
//         res.status(400).render('home.hbs',{message: 'Fehler beim registrieren. Versuchen Sie es erneut.'});
//     });
// });

// app.get('/users/me', authenticate, (req,res)=>{
//     res.render(req.user);
// });

// Rent routes
// app.post('/rents', authenticate, (req, res)=>{
//     var rent = new Rent({
//         datum: new Date(req.body.datum),
//         player1: req.body.player1,
//         player2: req.body.player2,
//         start: new Date(`1899-12-30T${req.body.start}:00Z`),
//         ende: new Date(`1899-12-30T${req.body.ende}:00Z`),
//         _member: req.user._id  
//     });

//     rent.save().then((doc)=>{
//         res.send(doc);
//     }, (err)=>{
//         res.status(400).send(err);
//     });
// });

// app.get('/rents', authenticate, (req,res)=>{
//     Rent.find({
//         _member: req.user._id
//     }).then((rents)=>{
//         res.send({rents});
//     }, (err)=>{
//         res.status(400).send(err);
//     });
// });

// app.get('/rents/:id', authenticate,(req,res)=>{
//     var id=req.params.id;

//     if (!ObjectID.isValid(id)) {
//         return res.status(404).send();
//     }
//     Rent.findOne({
//         _id: id,
//         _member: req.user._id
//     }).then((rent)=>{
//         if (!rent){
//             return res.status(404).send();
//         }

//         res.send({rent});
//     }).catch((e)=>{
//         res.status(400).send();
//     });
// });

// app.delete('/rents/:id', authenticate,(req,res)=>{
//     var id=req.params.id;

//     if (!ObjectID.isValid(id)){
//         return res.status(404).send();
//     }
//     Rent.findOneAndRemove({
//         _id: id,
//         _member: req.user._id
//     }).then((rent)=>{
//         if (!rent){
//             return res.status(404).send();
//         }
//         res.send({rent});
//     }).catch((err)=>{
//         res.status(400).send(err);
//     });
// });

// app.patch('/rents/:id', authenticate,(req,res)=>{
//     var id= req.params.id;
//     var body= _.pick(req.body,['datum','paid']);

//     if (!ObjectID.isValid(id)){
//         return res.status(404).send();
//     }

//     if (_.isBoolean(body.paid)&&body.paid){
//         body.datum = new Date("2017-09-15T22:00:00.000Z");
//     } else {
//         body.paid=false;
//         body.datum=null;
//     }

//     Rent.findOneAndUpdate({
//         _id: id,
//         _member: req.user._id
//     },{$set:body},{new: true}).then((rent)=>{
//         if (!rent){
//             return res.status(404).send();
//         }

//         res.send({rent});
//     }).catch((e)=>{
//         res.status(400).send();
//     });
// });

