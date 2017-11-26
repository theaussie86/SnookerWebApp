const express = require('express');
const _ = require('lodash');
const moment = require('moment');

const {User} = require('./../models/user');
const {Break} = require('./../models/break');
const {Rent} = require('./../models/rent');
const {isLoggedIn} = require('./../middleware/authenticate');

var dataroutes = express.Router();

dataroutes.get('/enterbreak',isLoggedIn,(req,res)=>{
    res.render('enterbreaks.hbs',{
        title: 'Breaks eingeben',
        user: req.user
    });
});

dataroutes.post('/enterbreak',isLoggedIn,(req,res)=>{
    var body = _.pick(req.body,['datum','player','break']);
    body.datum= new Date(body.datum).setHours(12);
    let newBreak = new Break(body);
    if (!req.body.player){
        newBreak.player = req.user.username;
        newBreak._member = req.user._id;
    }
    newBreak.save().then((doc)=>{
        req.flash('success_msg',`Das Break mit ${doc.break} Punkten von ${doc.player} ist gespeichert.`);
        res.redirect('/data/enterbreak');
    },(e)=>{
        req.flash('error_msg',`Beim Abspeichern gab es ein Problem. ${e} Versuchen Sie es erneut.`);
        res.redirect('/data/enterbreak');
    });
});

dataroutes.get('/entervisitor',isLoggedIn,(req,res)=>{
    res.render('entervisitors.hbs',{
        title: 'Gäste abrechnen',
        user: req.user
    });
});

dataroutes.post('/entervisitor',isLoggedIn,(req,res)=>{
    var body = _.pick(req.body,['datum','player1','player2','start','ende']);
    body.start = moment(body.start,'hh:mm');
    body.ende = moment(body.ende,'hh:mm');
    if(body.start>body.ende){
        body.ende.add(1,'d');
    }
    var newRent = new Rent(body);
    if (!req.body.player1){
        newRent.player1=req.user.username;
    } else {
        newRent.onlyGuests = true;
    }
    newRent._member=req.user._id;
    newRent.save().then((doc)=>{
        var guests;
        if (doc.onlyGuests){
            guests=2;
        } else{
            guests=1;
        }

        var betrag = (Math.ceil((doc.ende-doc.start)*3.5/360000)*guests/10).toFixed(2).replace('.',',')+' €';

        req.flash('success_msg',`${doc.player1} und ${doc.player2}; Rechnungsbetrag: ${betrag}; Abgerechnet bei: ${req.user.username}.`);
        res.redirect('/data/entervisitor');
    },(e)=>{
        req.flash('error_msg',`Beim Abspeichern gab es ein Problem. ${e}. Versuchen Sie es erneut.`);
        res.redirect('/data/entervisitor');
    });
});

dataroutes.get('/profile',isLoggedIn,(req,res)=>{
    res.render('mprofil.hbs',{
        title: 'Mein  Profil',
        user: req.user
    });
});

dataroutes.post('/profile',isLoggedIn, (req,res)=>{
    var body = req.body;
    var info = "Keine Änderungen!";  
    User.findById(req.user._id).then(async (user)=>{ 
        if(body.username && user.username != body.username) {
            await Break.update({_member: user._id},{$set:{player:body.username}},{multi: true}).exec();
            await Rent.update({
                _member: req.user._id,
                onlyGuests: false,
                player1: req.user.username
            },{$set:{player1: body.username}},{multi:true}).exec();
            await Rent.update({
                _member: req.user._id,
                onlyGuests: false,
                player2: req.user.username
            },{$set:{player2: body.username}},{multi:true}).exec();

            user.username = body.username;
            info=`Username in ${body.username} geändert.\n`;
        }

        if(body.email && user.email != body.email) {
            user.email = body.email;              
            info=info+`Email auf ${body.email} geändert.\n`;
        }

        if(body.handy && user.handy != body.handy) {
            user.handy = body.handy;                
            info=info+`Handynummer zu ${body.handy} geändert.\n`;
        }

        if(body.strasse && user.street != body.strasse) {
            user.street = body.strasse;                
            info=info+`Straße in ${body.strasse} geändert.\n`;
        }

        if(body.plz && user.zip != body.plz) {
            user.zip = body.plz;                
            info=info+`PLZ auf ${body.plz} geändert.\n`;
        }

        if(body.ort && user.city != body.ort) {
            user.city = body.ort;                
            info=info+`Wohnort in ${body.ort} geändert.\n`;
        }
        user.save().then((doc)=>{
            req.flash('success_msg',info);
            res.redirect('/data/profile');
        });
    }).catch((e)=>{
        req.flash('error_msg','Fehler! '+e);
        res.redirect('/data/profile');    
    });
});


module.exports = {dataroutes};