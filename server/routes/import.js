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
                req.flash('success_msg','_member ist noch nicht gesetzt')
                res.redirect('/');
                
            } else if (serie.mitID&&serie._member){
                console.log('_member ist schon gesetzt, aber mitID gibt es noch');
                updateOldIds();
                req.flash('success_msg','_member ist schon gesetzt, aber mitID gibt es noch')
                res.redirect('/');
                
            } else if (!serie.mitID&&serie._member){
                console.log('Alles richtig gesetzt');
                req.flash('success_msg','Alles richtig gesetzt')
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

module.exports = {importRouter};