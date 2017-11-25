const express = require('express');

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
    res.render('bmembers.hbs',{
        title: 'Mitgliederverwaltung',
        user: req.user
    });
});

// BREAKS
boardroutes.get('/breaks',isAdmin,(req,res)=>{
    res.render('bbreaks.hbs',{
        title: 'Breakverwaltung',
        user: req.user
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