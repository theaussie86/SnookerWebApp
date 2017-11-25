const express = require('express');

const {importSQLData} = require('./../db/import/import');
const {updateBreaksAndRents,updateOldIds}=require('./../db/import/update');
const {User} = require('./../models/user');
const {Break} = require('./../models/break');
const {Rent} = require('./../models/rent');
var importRouter = express.Router();

importRouter.get('/', (req,res)=>{

    Rent.count({}).exec((err,result)=>{
        if (err) throw err;
        if (result>0){
            console.log('kein Import nötig...');
            req.flash('info_msg','Kein Import nötig. Es sind Daten vorhanden.');
            res.redirect('/');
        } else {
            console.log('Import wird gestartet...');
            importSQLData();
            req.flash('success_msg','Alle Daten importiert');
            res.redirect('/');
        }        
    });

});

importRouter.get('/update',(req,res)=>{
    Break.findOne({player: 'Murat'}).then((serie)=>{
        
            if (serie.mitID&&!serie._member){
                console.log('_member ist noch nicht gesetzt');
                updateBreaksAndRents();
                req.flash('info_msg','_member ist noch nicht gesetzt')
                res.redirect('/');
                
            } else if (serie.mitID&&serie._member){
                console.log('_member ist schon gesetzt, aber mitID gibt es noch');
                updateOldIds();
                req.flash('info_msg','_member ist schon gesetzt, aber mitID gibt es noch')
                res.redirect('/');
                
            } else if (!serie.mitID&&serie._member){
                console.log('Alles richtig gesetzt');
                req.flash('info_msg','Alles richtig gesetzt')
                res.redirect('/');
                
            } else {
                console.log('Hier stimmt was nicht');
                throw new Error('Hier stimmt was nicht');
                req.flash('error_msg','Hier stimmt was nicht')
                res.redirect('/');                
            }
        }).catch((e)=>{
            console.log(e);
            req.flash('error_msg',e)
            res.redirect('/');
        });
});

importRouter.get('/bills',(req,res)=>{

    User.find({}, (err, users)=>{
        if (err) throw err;
    }).cursor().on('data',(user)=>{
        var userId = user._id;
        user.memberships.forEach(async(element) => {
            var start = element.membershipStart;
            var ende;
            if (element.membershipEnd.getTime() ===0){
                ende = new Date();
                ende.setDate(1);
                ende.setHours(12);
            } else {
                ende = element.membershipEnd;
            }
            while (start<ende) {
                try {
                    const rents = await Rent.find({
                        _member: userId,
                        datum:{$gte: new Date(start.getFullYear(),start.getMonth()-1,1,12), $lte: new Date(start.getFullYear(),start.getMonth(),0,12)}
                    });
                    const sales = await rents.reduce((sum, rent)=>{
                        var guests=1;
                        if (rent.onlyGuests) guests = 2;
                        return sum + (Math.ceil(3.5*(rent.ende-rent.start)/360000)*guests/10);
                    },0);
                        user.bills.push({
                            billDate : start,
                            membershipFee: element.membershipFee,
                            feePaid: true,
                            visitorsSales: sales,
                            salesPaid: true,
                        });
                        await user.save();
                } catch (err) {
                    req.flash('error_msg',`Fehler: ${err}`);
                    res.redirect('/');            
                }
                start = new Date(start.getFullYear(),start.getMonth()+1,start.getDate(),12);                    
            }
        });
    }).on('end',()=>{
        console.log('Alle Rechnungen erstellt.');
        req.flash('success_msg','Alle Rechnungen erstellt');
        res.redirect('/');
    });
    
});


module.exports = {importRouter};