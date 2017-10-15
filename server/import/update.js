require('./../config/config');

const {mongoose} = require('./../db/mongoose');
const {Rent} = require('./../models/rent');
const {Break} = require('./../models/break');
const {User} = require('./../models/user');
const {members, tischmiete, breaks}= require('./snookerdata');

var updateBreaksAndRents= ()=>{
    User.find({}, (err, users)=>{
        if (err) {
           return console.log(err);
        }
    }).cursor()
    .on('data',(user)=>{
        console.log('IDs für '+user.username+' zugeordnet');
        Break.update({mitID: user.mitID},{$set:{_member: user._id}},{multi: true}).exec();
        Rent.update({mitID: user.mitID},{$set:{_member: user._id}},{multi:true}).exec();
    }).on('end',()=>{console.log('Zuordnung abgeschlossen.')});          
};

var updateOldIds = () => {
    User.update({},{$unset:{mitID:''}},{multi: true}).exec();
    Rent.update({},{$unset:{mitID:''}},{multi: true}).exec();
    Break.update({},{$unset:{mitID:''}},{multi: true}).exec(); 
    console.log('Alle alten IDs wurden gelöscht');
};

var fertig = false;

Break.findOne({player: 'Murat'}).then((serie)=>{

    if (serie.mitID&&!serie._member){
        console.log('_member ist noch nicht gesetzt');
        updateBreaksAndRents();
    } else if (serie.mitID&&serie._member){
        console.log('_member ist schon gesetzt, aber mitID gibt es noch');
        updateOldIds();
    } else if (!serie.mitID&&serie._member){
        console.log('Alles richtig gesetzt');
    } else {
        console.log('Hier stimmt was nicht');
        throw new Error('Hier stimmt was nicht');
    }

});





