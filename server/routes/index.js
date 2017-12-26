require('./../config/config');

const express = require('express');
const nodemailer = require('nodemailer');
const async = require('async');
const crypto = require('crypto');

const {User} = require('./../models/user');
const {Break} = require('./../models/break');
const {Rent} = require('./../models/rent');
const {isLoggedIn} = require('./../middleware/authenticate');

var router = express.Router();

// HOME
router.get('/',(req,res)=>{
    res.render('home.hbs',{
        title: 'Home',
        user: req.user
    });
});

// LOGIN
router.get('/login',(req,res)=>{
    
    res.render('login.hbs',{
        title: 'Login',
        user: req.user
    });
});

// LOGOUT
router.get('/logout', isLoggedIn, (req, res)=>{
    
    req.logout()
    req.flash('success_msg','Sie haben sich erfolgreich ausgeloggt.');
    res.redirect('/');
});

// RESET PASSWORD

router.get('/forgot',(req,res)=>{
    res.render('forgot.hbs',{
        title: 'Passwort vergessen',
        user: req.user
    });
});

router.post('/forgot',(req,res,next)=>{
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

router.get('/reset/:token',(req,res)=>{
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } },(er, user)=>{
        if (!user) {
            req.flash('error_msg','Password Reset Link ist ungültig oder abgelaufen.');
            return res.redirect('/forgot');
        }
        res.render('reset.hbs',{
            title:'neues Passwort eingeben',
            'info_msg':'Das Passwort muss mindestens eine Ziffer und einen Buchstaben enthalten und mindestens 6 Zeichen lang sein.'
        });
    });
});

router.post('/reset/:token', function(req, res) {
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

router.get('/about', (req, res) =>{
    res.render('about.hbs',{
        title: 'Impressum'
    });
});

router.get('/maintenance', (req, res) =>{
    res.render('maintenance.hbs',{
        title: 'Wartung'
    });
});

module.exports= {router};