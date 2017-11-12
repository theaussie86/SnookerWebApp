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
const moment = require('moment');

const publicPath = path.join(__dirname,'../public');
const {mongoose} = require('./db/mongoose');
const {User} = require('./models/user');
const {Break} = require('./models/break');
const {Rent} = require('./models/rent');
const {importRouter} = require('./routes/import');
const {isLoggedIn, isAdmin} = require('./middleware/authenticate');

var app = express();

// Middleware
app.use(morgan('dev'));
app.use(session({
    secret: process.env.JWT_SECRET,
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

// Middleware for Routes
app.use('/import',importRouter);

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
app.use(validator());
app.set('port', (process.env.PORT || 3000));
require('./middleware/passport')(passport);

app.set('views',publicPath+'/views');
hbs.registerPartials(publicPath+ '/views/partials');
app.set('view engine','hbs');

app.use((req, res, next) => {
    var now = new Date().toString();
    var log = `${now}: ${req.method} ${req.url}`;

    fs.appendFile('server.log',log + '\n', (err) => {
        if (err) console.log('Unable to append to server.log.');
    });
    next();
});

// app.use((req, res, next) => {
//     res.render('maintenance.hbs');
// });

app.use(express.static(publicPath));

hbs.registerHelper('getCurrentYear',() => {
    return new Date().getFullYear();
});

hbs.registerHelper('formatDate',(date)=>{
    return moment(date).format('DD.MM.YYYY');
})
// Login, Logout, Register, Reset
// Homepage
app.get('/',(req,res)=>{
    res.render('home.hbs',{
        title: 'Home',
        user: req.user
    });
});

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

        req.logout()
        req.flash('success_msg','Sie haben sich erfolgreich ausgeloggt.');
        res.redirect('/');

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
                auth: {
                  user: process.env.EMAIL_USER,
                  pass: process.env.EMAIL_PASS
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
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
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



        // app.get('/users', (req,res) => {
        //     User.find().then((users) => {
        //         res.send({users});
        //     },(err) => {
        //         res.status(400).send(err);
        //     });
        // });

    // Mitgliederseiten
    app.get('/members',isLoggedIn, (req, res) =>{

        res.render('members.hbs',{
            title: 'Mitglieder',
            user: req.user
        });

    });

    app.get('/dashboard/hbreaks',(req,res)=>{
        Break.aggregate({$sort:{break:-1}},{$limit: 10},{
            $project:{
                _id: false,
                player: true,
                break: true,
                datum: true
            }
        }).then((breaks)=>{
            res.send(breaks);
        },(err)=>{
            if (err) throw err;
        });
    });

    app.get('/dashboard/lbreaks',(req,res)=>{
        Break.aggregate({$sort:{datum:-1}},{$limit: 10},{
            $project:{
                _id: false,
                player: true,
                break: true,
                datum: true
            }
        }).then((breaks)=>{
            res.send(breaks);
        },(err)=>{
            if (err) throw err;
        });
    });

    app.get('/dashboard/lvisitors',(req,res)=>{
        Rent.aggregate({$sort:{datum:-1}},{$limit:5},{
            $project:{
                _id: false,
                datum: true,
                player1: true,
                player2: true,
                spielzeit:{$divide:[{$ceil:{$divide:[{$subtract: ["$ende","$start"]},360000]}},10]}
            }
        }).then((rents)=>{
            res.send(rents);
        },(err)=>{
            if (err) throw err;
        });
    });

    app.get('/dashboard/lastmonths',(req,res)=>{
         
        Rent.aggregate({
            $project:{
                _id: false,
                datum: true,
                year:{$year:"$datum"},
                month:{$month: "$datum"},
                betrag:{$divide:[{$ceil:{$multiply:[{$divide:[{$subtract: ["$ende","$start"]},360000]},3.5]}},10]}                
            }
        },{
            $match:{
                year: new Date(2016,5,13).getFullYear(),
                $or:[{month:new Date(2016,5,13).getMonth()},{month:new Date(2016,5,13).getMonth()-1}]                
            }
        },{
            $group:{
                _id: "$month",
                umsatz: {$sum: "$betrag"}
            }
        }).then((rents)=>{
            if (!rents) {
                return res.status(404).send('keine ergebnisse gefunden');
            }
            res.send(rents);
        }).catch((e)=>{
            console.log(e);
        });
    });

    app.get('/breaks',isLoggedIn,(req,res)=>{
        res.render('mbreaks.hbs',{
            title:'Meine Breaks',
            user: req.user
        });
    });

    app.get('/breaks/get',isLoggedIn,(req, res)=>{
        var userId = req.user._id;

        Break.find({_member: userId}).sort({break: -1}).then((breaks)=>{
            if (!breaks){
                req.flash('info_msg','Von dir gibt es noch keine Breaks in der Datenbank.');
                res.redirect('/members');
            }
            res.send(breaks);
        }, (err)=>{
            req.flash('error_msg','Es ist ein Fehler aufgetreten.');
            res.redirect('/members');
        });
    });

    app.get('/visitors',isLoggedIn,(req,res)=>{
        res.render('mvisitors.hbs',{
            title: 'Meine Gastumsätze',
            user: req.user
        });
    })

    app.get('/visitors/get',isLoggedIn,(req,res)=>{
        var userId = req.user._id;
        Rent.aggregate({$match:{_member: userId}},{$sort:{datum:-1}},{
            $project:{
                _id: false,
                datum: true,
                player1: true,
                player2: true,
                spielzeit:{$divide:[{$ceil:{$divide:[{$subtract: ["$ende","$start"]},360000]}},10]},
                betrag:{$divide:[{$ceil:{$multiply:[{$divide:[{$subtract: ["$ende","$start"]},360000]},3.5]}},10]}
            }
        }).then((rents)=>{
            if (!rents){
                req.flash('info_msg','Du warst noch nicht mit Gastspielern spielen.');
                res.redirect('/members');
            }
            res.send(rents);
        },(err)=>{
            req.flash('error_msg','Es ist ein Fehler aufgetreten.');
            res.redirect('/members');
        });
    });

    app.get('/bills',isLoggedIn,(req,res)=>{
        res.render('mbills.hbs',{
            title: 'Meine Rechnungen',
            user: req.user
        });
    });

    app.get('/bills/get',isLoggedIn,(req, res)=>{
        var userId = req.user._id;
        Rent.aggregate({$match:{_member: userId}},{
            $group:{
                _id: {monat:{$month: "$datum"},jahr:{$year: "$datum"},member: "$_member"},
                Anzahl: {$sum:1},
                Gastumsatz:{$sum:{$divide:[{$ceil:{$multiply:[{$divide:[{$subtract: ["$ende","$start"]},360000]},3.5]}},10]}},
                Umsätze:{$push: "$$ROOT"}
            }
        },{
            $lookup:{
                from: "users",
                localField: "_id.member",
                foreignField: "_id",
                as: "User"
            }
        },{
            $unwind:"$User"
        },{
            $project:{
                _id: true,
                Anzahl: true,
                Gastumsatz: true,
                Umsätze: true,
                User: true,
                Datum: {$arrayElemAt:["$Umsätze.datum",0]}
            }
        },{
            $project:{
                _id: true,
                Anzahl: true,
                Gastumsatz: true,
                Umsätze: true,
                Datum: true,
                membership: {
                    $map:{
                        input:"$User.memberships",
                        as: "mem",
                        in:{$cond:[
                            {$and:[
                                {$gte:["$Datum","$$mem.membershipStart"]},
                                {$or:[{$eq:["$$mem.membershipEnd",new Date(0)]},{$lte:["$Datum","$$mem.membershipEnd"]}]}
                            ]},
                            "$$mem.membershipFee",
                            false
                        ]}
                    }
                }
            }
        },{
            $project:{
                _id: true,
                // Anzahl: true,
                Datum: true,
                Gastumsatz: true,
                Umsätze: true,               
                Beitrag:{
                    $filter:{
                        input: "$membership",
                        as: "mem",
                        cond:{$ne: ["$$mem",false]}
                    }
                }
            }
        },{$unwind: "$Beitrag"}).then((bills)=>{
            if (!bills){
                console.log('keine Rechnungen gefunden.')
                res.status(404).send();
                // req.flash('info_msg','Du hast noch keine Rechnungen.');
                // res.redirect('/members');
            }
            res.send(bills);
        },(err)=>{
            res.status(400).send();
            console.log(err);
            // req.flash('error_msg','Es ist ein Fehler aufgetreten.');
            // res.redirect('/members');
        });
    })
        
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

function CheckLoginForm (req, res, next){
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

function CheckRegisterForm (req, res, next){
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

module.exports = {app, passport, validator};



// User routes




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

