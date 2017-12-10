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
        user.memberships.push({
            membershipType: art.replace(/(^[a-z])|(\s+[a-z])/g, txt => txt.toUpperCase()),
            membershipFee: beitrag,
            membershipStart: start
        });
        user.save();
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
        breaks = breaks.map((x)=>{
            return {
                player:x.player,
                datum: x.datum,
                break: x.break
            };
        });
        res.send(breaks);
    },(err)=>{
        res.send({'error_msg':'Es ist ein Fehler aufgetreten.\n'+err});
    });
});

boardroutes.get('/userbreaks',isAdmin,(req,res)=>{
    var userId = req.user._id;
    Break.find({_member: userId}).then((breaks)=>{
        if (breaks.length===0) res.send({info: 'Von dir gibt es noch keine Breaks in der Datenbank'});
        breaks = breaks.map((x)=>{
            return {
                player:x.player,
                datum: x.datum,
                break: x.break
            };
        });
        res.send(breaks);
    },(err)=>{
            res.send({'error_msg':'Es ist ein Fehler aufgetreten.\n'+err});
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
            req.flash({'error_msg':`Es ist ein Fehler aufgetreten. ${err}.`});
            res.send();
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

    User.aggregate([{$unwind: "$bills"},{
        $project:{
            _id: false,
            username: true,
            bills: true
        }
    }]).then((bills)=>{
        return bills.map((x)=>{
            return {
                username: x.username,
                billDate: x.bills.billDate,
                membershipFee: x.bills.membershipFee,
                visitorsSales: x.bills.visitorsSales,
                sent: x.bills.sent,
                salesPaid: x.bills.salesPaid,
                feePaid: x.bills.feePaid
            }
        }).sort((a,b,)=>b.billDate-a.billDate);
    }).then((bills)=>{
        var names = bills.reduce((a,b)=>{
            if(a.indexOf(b.username)<0) a.push(b.username);
            return a;
        },[]);
        res.render('bbills.hbs',{
            title: 'Rechnungsverwaltung',
            user: req.user,
            names: names,
            bills: bills
        });
    }).catch((e)=>{
        req.flash('error_msg',`Es ist ein Fehler aufgetreten. ${e}.`);
        res.redirect('/members');
    });
});

boardroutes.get('/makebills',isAdmin,(req,res)=>{
    var vdate = new Date();
    vdate = new Date(vdate.getFullYear(),vdate.getMonth(),0,12);
    User.find({}, (err,users)=>{
        if (err) throw err;        
    }).cursor().on('data',(user)=>{
        var start = user.bills[user.bills.length-1].billDate;
        while (start<vdate){
            start = new Date(start.getFullYear(),start.getMonth()+2,0,12);
            console.log(start);
            user.memberships.forEach((element) => {
                if (element.membershipStart<start &&(start<=element.membershipEnd || element.membershipEnd.getTime()===0)) {
                    var beitrag = element.membershipFee;
                    if (start.getTime()===element.membershipEnd.getTime()) beitrag=0;
                    Rent.find({
                        _member: user._id,
                        datum:{$gte: new Date(start.getFullYear(),start.getMonth(),1,12), $lte: new Date(start.getFullYear(),start.getMonth()+1,0,12)}        
                    }).then((rents)=>{
                        var sales = rents.reduce((sum, rent)=>{
                            var guests=1;
                            if (rent.onlyGuests) guests = 2;
                            return sum + (Math.ceil(3.5*(rent.ende-rent.start)/360000)*guests/10);
                        },0);
                        var paid = false;
                        if (sales===0) paid= true;
                        user.bills.push({
                            billDate: start,
                            membershipFee: beitrag,
                            visitorsSales: sales,
                            salesPaid: paid
                        });
                        user.save();
                    }).catch((e)=>{
                        throw e;
                    });
                }
            });
        }
    }).on('end',()=>{
        console.log('Alle Rechnungen erstellt.');
        req.flash('success_msg','Alle Rechnungen erstellt.')
        res.redirect('/members');
    });
});

boardroutes.get('/filterbills',isAdmin,(req,res)=>{
    console.log(req.query);
    User.aggregate([{$unwind: "$bills"},{
        $project:{
            _id: false,
            username: true,
            bills: true
        }
    }]).then((bills)=>{
        if (req.query.member !=0) {
            bills = bills.reduce((a,b)=>{
                if(b.username===req.query.member) a.push(b);
                return a;
            },[]);
        }        
        bills =bills.map((x)=>{
            return {
                username: x.username,
                billDate: x.bills.billDate,
                membershipFee: x.bills.membershipFee,
                visitorsSales: x.bills.visitorsSales,
                sent: x.bills.sent,
                salesPaid: x.bills.salesPaid,
                feePaid: x.bills.feePaid
            }
        });
        if (req.query.year !=0 && req.query.month !=0){
            bills = bills.reduce((a,b)=>{
                if(b.billDate.getMonth()===req.query.month-1 && b.billDate.getFullYear()===Number(req.query.year)) a.push(b);
                return a;
            },[]);
        } else if (req.query.year !=0 && req.query.month ==0){
            bills = bills.reduce((a,b)=>{
                if(b.billDate.getFullYear()===Number(req.query.year)) a.push(b);
                return a;
            },[]);
        }   else if (req.query.year ==0 && req.query.month !=0){
            bills = bills.reduce((a,b)=>{
                if(b.billDate.getMonth()===req.query.month-1) a.push(b);
                return a;
            },[]);
        }
        bills = bills.sort((a,b,)=>b.billDate-a.billDate);

        res.send({
            message:`Rechnungen gefiltert. ${bills.length} Treffer gefunden.`,
            bills: bills
        });

    }).catch((e)=>{
        res.send({message:`Es ist ein Fehler aufgetreten.\n ${e}`});
    });

});

boardroutes.get('/singlebill',isAdmin, (req,res)=>{
    const username = req.query.username;
    console.log(req.query.username, id);
    var datum =new Date(Number(req.query.datum));
    User.find({
        username: username
    }).then((user)=>{
        var bill = user.bills.filter((x)=> x.billDate.getTime()===datum.getTime());
        res.send(bill);
    }).catch((e)=>{
        res.send(e);
    });
});

boardroutes.get('/sendbills',isAdmin,(req,res)=>{
    
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