const express = require('express');
const _ = require('lodash');

const {User} = require('./../models/user');
const {Break} = require('./../models/break');
const {Rent} = require('./../models/rent');
const {isLoggedIn} = require('./../middleware/authenticate');

var memberroutes = express.Router();

memberroutes.get('/',isLoggedIn, (req, res) =>{    
    res.render('members.hbs',{
        title: 'Mitglieder',
        user: req.user
    });
});

memberroutes.get('/hbreaks',(req,res)=>{
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
        if (err) {
            res.send({
                'err':err
            });
        };
    });
});

memberroutes.get('/lbreaks',(req,res)=>{
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
        if (err) {
            res.send({
                'err':err
            });
        };
    });
});

memberroutes.get('/lvisitors',(req,res)=>{
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
        if (err) {
            res.send({
                'err':err
            });
        };
    });
});

memberroutes.get('/lastmonths',(req,res)=>{
     
    Rent.aggregate({
        $project:{
            _id: false,
            datum: true,
            year:{$year:"$datum"},
            month:{$month: "$datum"},
            betrag:{
                $multiply:[{$divide:[{$ceil:{$multiply:[{$divide:[{$subtract: ["$ende","$start"]},360000]},3.5]}},10]},
                {$cond:[{$eq:["$onlyGuests", true]},2,1]}]
            }                
        }
    },{
        $match:{
            year: new Date().getFullYear(),
            $or:[{month:new Date().getMonth()},{month:new Date().getMonth()-1}]                
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
    }).catch((err)=>{
        res.send({
            'err':err
        });
    });
});

memberroutes.get('/breaks',isLoggedIn,(req,res)=>{
    var userId = req.user._id;

    Break.find({_member: userId}).sort({break: -1}).then((breaks)=>{
        if (breaks.length === 0){
            res.render('mbreaks.hbs',{
                title: 'Meine Breaks',
                user: req.user,
                'info_msg':'Von dir gibt es noch keine Breaks in der Datenbank.'
            });
        } 
        res.render('mbreaks.hbs',{
            title:'Meine Breaks',
            user: req.user,
            breaks: breaks,
        });    

    }, (err)=>{
        req.flash('error_msg','Es ist ein Fehler aufgetreten.\n'+err);
        res.redirect('/members');
    });
});

memberroutes.get('/visitors',isLoggedIn,(req,res)=>{
    var userId = req.user._id;

    Rent.find({_member: userId}).sort({datum: -1}).then((docs)=>{
        if (docs.length === 0){
            res.render('mvisitors.hbs',{
                title: 'Meine Gäste',
                user: req.user,
                'info_msg':'Du warst noch nicht mit Gastspielern spielen.'
            });
        }
        rents = docs.map((x)=>{
            var guests = 1;
            var pl;
            if(x.onlyGuests) {
                guests=2;
                pl = x.player1+' und '+x.player2;
            } else if(x.player1 === req.user.username){
                pl = x.player2;
            } else {
                pl = x.player1;
            }
            return {
                datum: x.datum,
                player: pl,
                onlyGuests: x.onlyGuests,
                spielzeit: (Math.ceil((x.ende-x.start)/360000)/10)+' h',
                betrag: Math.ceil((x.ende-x.start)*3.5/360000)*guests/10
            }
        });
        var umsatz = docs.reduce((a,b)=>{
            var guests = 1;
            if (b.onlyGuests) guests = 2;
            return a + (Math.ceil((b.ende-b.start)*3.5/360000)*guests/10);
        },0);

        res.render('mvisitors.hbs',{
            title: 'Meine Gäste',
            user: req.user,
            rents: rents,
            umsatz: umsatz
        });
    },(err)=>{
        req.flash('error_msg','Es ist ein Fehler aufgetreten.\n'+err);
        res.redirect('/members');
    });
});

memberroutes.get('/visitors/get/:monat/:jahr',isLoggedIn,(req,res)=>{
    var userId = req.user._id;
    var start;
    var end;
    if (req.params.monat!=0 && req.params.jahr!=0){
        start= new Date(req.params.jahr,req.params.monat-1,1);
        end= new Date(req.params.jahr,req.params.monat,0);
    } else if(req.params.monat != 0 && req.params.jahr==0){
        start= new Date(new Date().getFullYear(),req.params.monat-1,1);
        end= new Date(new Date().getFullYear(),req.params.monat,0);
    } else if(req.params.monat == 0 && req.params.jahr!=0){
        start= new Date(req.params.jahr,0,1);
        end= new Date(req.params.jahr,11,31);
    } else {
        start= new Date(2015,0,1);
        end= new Date();
    }
    
    Rent.aggregate({$match:{
        _member: userId,
        datum:{$gte: start, $lte: end}
    }},{$sort:{datum:-1}}).then((docs)=>{
        if (docs.length === 0){
            req.send('info_msg','Keine Gastumsätze gefunden.');
        }
        rents = docs.map((x)=>{
            var guests = 1;
            var pl;
            if(x.onlyGuests) {
                guests=2;
                pl = x.player1+' und '+x.player2;
            } else if(x.player1 === req.user.username){
                pl = x.player2;
            } else {
                pl = x.player1;
            }
            return {
                datum: x.datum,
                player: pl,
                onlyGuests: x.onlyGuests,
                spielzeit: (Math.ceil((x.ende-x.start)/360000)/10),
                betrag: Math.ceil((x.ende-x.start)*3.5/360000)*guests/10
            }
        });
        res.send(rents);
    },(err)=>{
        res.send({err: err});
    });
});

memberroutes.get('/bills',isLoggedIn,(req,res)=>{
    const bills = req.user.bills;
    
    bills.sort(function (a, b) {
        if (a.billDate > b.billDate) {
            return -1;
        }
        if (a.billDate < b.billDate) {
            return 1;
        }
        return 0;
    });

    res.render('mbills.hbs',{
        title: 'Meine Rechnungen',
        user: req.user,
        bills: bills
    });
});

memberroutes.get('/bills/getUser',isLoggedIn, (req, res)=>{
    var user = _.pick(req.user,['firstname','lastname','street','zip','city','mitID']);
    res.send(user);
});

memberroutes.get('/bills/single/:time',isLoggedIn,(req,res)=>{
    const id = req.user._id;
    var datum =new Date(Number(req.params.time));
    var start = new Date(datum.getFullYear(),datum.getMonth()-1,datum.getDate(),12);
    var end = new Date(datum.getFullYear(),datum.getMonth(),0,12);
    Rent.find({
        _member: id,
        datum:{$gte: start,$lte: end}
    }).then((rents)=>{
        res.send(rents);
    }).catch((e)=>{
        res.send(e);
    });
});

module.exports = {memberroutes};