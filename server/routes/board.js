require('./../config/config');

const express = require('express');
const _ = require('lodash');
const moment = require('moment');
const nodemailer = require('nodemailer');
const {MongoClient} = require('mongodb');

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

boardroutes.get('/deletebreak',isAdmin,(req,res)=>{
    var dateParts = req.query.datum.split('.');
    var dat = new Date(dateParts[2],dateParts[1]-1,dateParts[0],12);
    var player = req.query.player;
    Break.findOneAndRemove({
        datum: dat,
        player: player,
        break: req.query.break
    },(err, serie)=>{ 
        if(err){
            req.flash({'error_msg':`Es ist ein Fehler aufgetreten. ${err}.`});
            res.send();
        }
        req.flash('success_msg',`Break ${serie.break} von ${serie.player} wurde gelöscht.`);
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
            bills: bills,
            board: true
        });
    }).catch((e)=>{
        req.flash('error_msg',`Es ist ein Fehler aufgetreten. ${e}.`);
        res.redirect('/members');
    });
});

boardroutes.get('/sendbills',isAdmin,(req, res)=>{
    var datum= new Date(req.query.jahr,req.query.monat,0,12);
    User.find({}).then((users)=>{
        users = users.filter((x)=>{
            return x.memberships.findIndex((x)=>{
                return (x.membershipStart<=datum && x.membershipEnd.getTime()===0) || (x.membershipStart<datum && x.membershipEnd>=datum)
            }) != -1;
        }).forEach((user,i,arr)=>{
            if (user.email.indexOf('@fake.com')=== -1) {
                var rechnung = user.bills.find((x)=>{
                    return (x.billDate.getTime() === datum.getTime());
                });
                user= _.pick(user,['username','email']);
                user.bill = rechnung;
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
                    subject: `Rechnung ${moment(user.bill.billDate).format('MMMM YYYY')}`,
                    text: `Hallo ${user.username},\n\n` +
                        `unten aufgeführt findest du die Details zu deiner Rechnung aus ${moment(user.bill.billDate).format('MMMM YYYY')}:\n\tGastumsatz ${moment(user.bill.billDate).format('MMMM')}: ${(user.bill.visitorsSales).toFixed(2).replace('.',',')+' €'}\n`+
                        `\tBeitrag ${moment().month(user.bill.billDate.getMonth()+1).format('MMMM')}: ${(user.bill.membershipFee).toFixed(2).replace('.',',')+' €'}\n\n`+
                        `Die gesamte Rechnung kannst du dir auf http://${req.headers.host}/members/bills herunterladen.\n\nMit freundlichen Gruß\nSnookerclub Neubrandenburg`
                };
                smtpTransport.sendMail(mailOptions, function(err, info) {
                    if (err){
                        console.log(err);
                    }
                });
            } 
            req.flash('success_msg', 'Emails gesendet.');
            res.send();
        });
    }).catch((e)=>{
        req.flash('error_msg', 'Fehler. '+e);
        res.send();
    });
});

boardroutes.get('/download',isAdmin,(req,res)=>{
    var datum= new Date(req.query.jahr,req.query.monat,0,12);
    var bDate= new Date(req.query.jahr,Number(req.query.monat)+1,0,12);
    var start = new Date(datum.getFullYear(),datum.getMonth(),1,12);
    var end = new Date(datum.getFullYear(),datum.getMonth()+1,0,12);
    var data=[];
    User.find({}).then((users)=>{
        users = users.filter((x)=>{
            return x.memberships.findIndex((x)=>{
                return (x.membershipStart<=datum && x.membershipEnd.getTime()===0) || (x.membershipStart<datum && x.membershipEnd>=datum)
            }) != -1;
        }).forEach((user,i, arr)=>{
            var uname= user.username;
            var beitrag = user.memberships.find((x)=>{
                return (x.membershipStart<= bDate && x.membershipEnd>= bDate) || (x.membershipStart<=bDate && x.membershipEnd.getTime()===0);
            });
            user= _.pick(user,['_id','firstname','lastname','street','zip','city']);
            user.billNr = `${req.query.jahr}-${req.query.monat}-${uname}`;
            user.zeitraum= moment(datum).format('MMMM YYYY');
            user.dueDate = moment(bDate).format('DD.MM.YYYY');
            if(!beitrag){
                user.beitrag = 0;
            } else {
                user.beitrag = beitrag.membershipFee;
            }
            Rent.find({
                _member: user._id,
                datum:{$gte: start,$lte: end}
            }).then((rents)=>{
                if (!rents){
                    user.summe = 0;
                } else {
                    rents = rents.map((x)=>{
                        var pl;
                        var guests=1;
                        if (x.onlyGuests) {
                            pl= `${x.player1} und ${x.player2}`
                            guests = 2;
                        } else if(x.player1 === uname) {
                            pl = x.player2;
                        } else{
                            pl= x.player1;
                        }
                        return{
                            datum: x.datum,
                            player: pl,
                            time: Math.ceil((x.ende-x.start)/360000)/10,
                            betrag: Math.ceil(3.5*(x.ende-x.start)/360000)*guests/10
                        }
                    });
                    user.summe = rents.reduce((sum,rent)=>{
                        return sum + rent.betrag*100;
                    },0)/100;
                }
                data.push({
                    user: user,
                    rents: rents
                });
                if (data.length === arr.length) res.send(data);
            });
        });        
    }).catch((e)=>{
        res.send(e);
    });
});

boardroutes.get('/downloadbills',isAdmin,(req,res)=>{
    res.render('downloadbills.hbs',{
        title: 'Rechnungen herunterladen',
        user: req.user,
        'info_msg':'Wähle Monat und Jahr aus!'
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
                            return sum + (Math.ceil(3.5*(rent.ende-rent.start)/360000)*guests*10);
                        },0);
                        var paid = false;
                        if (sales===0) paid= true;
                        user.bills.push({
                            billDate: start,
                            membershipFee: beitrag,
                            visitorsSales: sales/100,
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
    var datum =req.query.datum;
    User.findOne({
        username: username
    }).then((user)=>{
        var bill = user.bills.filter((x)=> {
            return x.billDate.getTime()===Number(datum);
        }).map((x)=>{
            return {
                salesPaid: x.salesPaid,
                feePaid: x.feePaid
            }
        });
        res.send(bill);
    }).catch((e)=>{
        res.send(e);
    });
});

boardroutes.get('/editbill',isAdmin, (req,res)=>{
    var datum = new Date(Number(req.query.datum));

    MongoClient.connect(process.env.MONGODB_URI,(err, db)=>{
        if (err) {res.send({'error_msg':`Es ist ein Fehler aufgetreten. ${err}.`});} else {
            db.collection('users').update({
                username: req.query.username,
                'bills.billDate': datum
            },{
                $set:{
                    'bills.$.salesPaid': req.query.salesPaid,
                    'bills.$.feePaid': req.query.feePaid
                }
            }, false, true);
            res.send({'success_msg':`Rechnung vom ${moment(Number(req.query.datum)).format('DD.MM.YYYY')} von ${req.query.username} geändert.`});
        }
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