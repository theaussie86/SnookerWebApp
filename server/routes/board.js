const express = require('express');
const he = require('he');
const moment = require('moment');

const {User} = require('./../models/user');
const {Break} = require('./../models/break');
const {Rent} = require('./../models/rent');
const {isLoggedIn, isAdmin} = require('./../middleware/authenticate');

var boardroutes = express.Router();

// HOME
boardroutes.get('/',isAdmin, (req, res) =>{
    res.render('board.hbs',{
        title: 'Vorstand',
        user: req.user
    });
});

// MEMBERS
boardroutes.get('/members',isAdmin,(req,res)=>{
    User.find({}).then((docs)=>{
        var members=docs.map((x)=>{
            return {
                username: x.username,
                firstname: x.firstname,
                lastname: x.lastname,
                aktiv: x.aktiv,
                isBoardMember: x.isBoardMember
            }
        });
        res.render('bmembers.hbs',{
            title: 'Mitgliederverwaltung',
            user: req.user,
            members: members
        });
    },(err)=>{
        req.flash('error_msg','Es ist ein Fehler aufgetreten.\n'+err);
        res.redirect('/board');
    });
});

boardroutes.get('/membership',isAdmin, (req, res)=>{
    User.findOne(req.query).then((user)=>{
        res.send({
            username: user.username,
            memberships: user.memberships,
            aktiv: user.aktiv
        });
    }, (err)=>{
        if (err) throw err;
    });
});

boardroutes.get('/editmembership',isAdmin, (req,res)=>{
    var username = req.query.username;
    var ende = Date.parse(req.query.membershipEnd);
    var art = req.query.membershipType;
    if (!ende){
        req.flash('error_msg','Es wurde kein Enddatum eingegeben!');
        res.redirect('/board/members');
    }

    User.findOne({username: username}).then((user)=>{
        ende = new Date(ende);
        ende = new Date(ende.getFullYear(),ende.getMonth()+1,0,12);
        var ind = user.memberships.findIndex((x)=>x.membershipType===art);
        user.memberships[ind].membershipEnd=ende;
        user.save();
        req.flash('success_msg',`Enddatum ${moment(ende).format('DD.MM.YYYY')} abgespeichert.`);
        res.redirect('/board/members');
    }).catch((e)=>{
        req.flash('error_msg','Es ist ein Fehler aufgetreten!\n'+e);
        res.redirect('/board/members');
    });

});

boardroutes.get('/newmembership',isAdmin, (req,res)=>{
    var username = req.query.username;
    var start = Date.parse(req.query.membershipStart);
    var art = req.query.membershipType;
    var beitrag = 50;

    if (art === 'rentner' || art === 'student') beitrag = 30;  

    if (!start){
        req.flash('error_msg','Es wurde kein Startdatum eingegeben!');
        res.redirect('/board/members');
    }

    User.findOne({username: username}).then((user)=>{
        start = new Date(start);
        start = new Date(start.getFullYear(),start.getMonth(),1,12);
        // user.memberships.push({
        //     membershipType: art,
        //     membershipFee: beitrag,
        //     membershipStart: start
        // });
        // user.save();
        req.flash('success_msg',`Neue Mitgliedschaft als ${art.replace(/(^[a-z])|(\s+[a-z])/g, txt => txt.toUpperCase())} für ${username} hinzugefügt. Die Mitgliedschaft beginnt ${moment(start).format('DD.MM.YYYY')}.`);
        res.redirect('/board/members');
    }).catch((e)=>{
        req.flash('error_msg','Es ist ein Fehler aufgetreten!\n'+e);
        res.redirect('/board/members');
    });

});

// BREAKS
boardroutes.get('/breaks',isAdmin,(req,res)=>{
    Break.find({}).sort({datum: -1}).then((breaks)=>{
        res.render('bbreaks.hbs',{
            title: 'Breakverwaltung',
            user: req.user,
            breaks: breaks
        });
    },(err)=>{
        req.flash('error_msg','Es ist ein Fehler aufgetreten.\n'+err);
        res.redirect('/board');
    });
});

boardroutes.get('/deletebreak/:datum/:player/:break',isAdmin,(req,res)=>{
    var dateParts = req.params.datum.split('.');
    var dat = new Date(dateParts[2],dateParts[1]-1,dateParts[0],12);
    var player = he.decode(req.params.player);
    Break.findOneAndRemove({
        datum: dat,
        player: player,
        break: req.params.break
    },(err, serie)=>{ 
        if(err){
            return req.flash({'error_msg':`Es ist ein Fehler aufgetreten. ${err}.`});
        }
        req.flash('success_msg',`Break ${serie.break} von ${serie.player} wurde gelöscht.`)
        res.send(serie);
    });
});

boardroutes.get('/editbreak/:datum/:player/:break',isAdmin,(req,res)=>{
    var dateParts = req.params.datum.split('.');
    var dat = new Date(dateParts[2],dateParts[1]-1,dateParts[0],12);
    var player = he.decode(req.params.player);
    Break.findOne({
        datum: dat,
        player: player,
        break: req.params.break
    },(err, serie)=>{ 
        if(err) throw err;
        res.send(serie);
    });
});

boardroutes.post('/editbreak',isAdmin,(req,res)=>{
    var body = req.body;
    var dateParts = body.datum.split('.');
    var dat = new Date(dateParts[2],dateParts[1]-1,dateParts[0],12);
    var player = he.decode(body.player);
    var info = "Keine Änderungen!";  
    Break.findOne({
        datum: dat,
        player: player,
        break: body.break
    }).then(async (serie)=>{ 
        var info="";
        if(body.player) {
            // serie.player = body.player;              
            info=info+`Spieler in ${body.player} geändert.\n`;
        }

        if(body.Datum) {
            // serie.datum = body.datum;                
            info=info+`Datum auf den ${body.datum} geändert.\n`;
        }

        if(body.break) {
            // user.street = body.strasse;                
            info=info+`Break in ${body.break} geändert.\n`;
        }
        if(info === "") info= "Keine Änderungen!"
        // user.save().then((serie)=>{
            res.send({'success_msg':info});
            // res.redirect('/board/breaks');
        // });
    }).catch((e)=>{
        req.flash('error_msg','Fehler! '+e);
        res.redirect('/board/breaks');    
    });
});

// VISITORS
boardroutes.get('/visitors',isAdmin,(req,res)=>{
    res.render('bvisitors.hbs',{
        title: 'Umsatzverwaltung',
        user: req.user
    });
});

// BILLS
boardroutes.get('/bills',isAdmin,(req,res)=>{
    res.render('bbills.hbs',{
        title: 'Rechnungsverwaltung',
        user: req.user
    });
});

// REGISTER
boardroutes.get('/register', isAdmin, (req,res)=>{
    res.render('register.hbs',{
        title: 'Registrieren',
        user: req.user,
        'info_msg':'Das Passwort muss mindestens eine Ziffer und einen Buchstaben enthalten und mindestens 6 Zeichen lang sein.'                
    });
});

module.exports = {boardroutes};