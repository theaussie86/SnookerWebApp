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

const publicPath = path.join(__dirname,'../public');
const {mongoose} = require('./db/mongoose');
const {User} = require('./models/user');
const {Rent} = require('./models/rent');
const {authenticate, isLoggedIn} = require('./middleware/authenticate');


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
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
const port = process.env.PORT || 3000;
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

        app.post('/login', passport.authenticate('login',{
            successRedirect: '/members',
            failureRedirect: '/login',
            failureFlash: true
        }));

    // Logout
        app.get('/logout', isLoggedIn, (req, res)=>{
            req.user.removeTokens().then(()=>{
                req.logout()
                req.session.destroy((err)=>{
                    res.redirect('/');
                });
            });
        });

    // Register
        app.get('/register', (req,res)=>{
            res.render('register.hbs',{
                title: 'Registrieren',
                user: req.user
            });
        });
        
        app.post('/register', passport.authenticate('register',{
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
                      req.flash('error', 'No account with that email address exists.');
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
                    subject: 'Snookertempel Passwort Reset',
                    text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                      'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                      'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                      'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                  };
                  smtpTransport.sendMail(mailOptions, function(err) {
                    req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                    done(err, 'done');
                  });
                }
              ], function(err) {
                if (err) return next(err);
                res.redirect('/forgot');
              });
        });

        app.get('/reset/:token',(req,res)=>{
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } },(er, user)=>{
                if (!user) {
                    req.flash('error','Password Reset Link ist ungültig oder abgelaufen.');
                    return res.redirect('/forgot');
                }
                res.render('reset.hbs', {
                    title: 'Passwort vergessen',
                    user: req.user
                });
            });
        });

        app.post('/reset/:token', function(req, res) {
            async.waterfall([
              function(done) {
                User.findOne({ resetPasswordToken: req.params.token}, function(err, user) {
                  if (!user) {
                      console.log('kein User gefunden.',req.params.token);
                    req.flash('error', 'Password reset token is invalid.');
                    return res.redirect('/login');
                  }
                  if (user.resetPasswordExpires< Date.now()){
                      console.log(user.resetPasswordExpires.toString()+' : '+ new Date().getTime().toString());
                      req.flash('error', 'Password reset token is expired.');
                      return res.redirect('/login');
                  }
                  user.password = req.body.password;
                  user.resetPasswordToken = undefined;
                  user.resetPasswordExpires = undefined;
          
                  user.save(function(err) {
                    req.logIn(user, function(err) {
                      done(err, user);
                    });
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
                    text: 'Hello,\n\n' +
                    'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
                    };
                smtpTransport.sendMail(mailOptions, function(err) {
                  req.flash('success', 'Success! Your password has been changed.');
                  done(err);
                });
              }
            ], function(err) {
              res.redirect('/');
            });
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

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

module.exports = {app, passport};

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

