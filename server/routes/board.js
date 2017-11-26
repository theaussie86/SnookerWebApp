const express = require('express');
const he = require('he');

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

boardroutes.get('/delete/:datum/:player/:break',isAdmin,(req,res)=>{
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