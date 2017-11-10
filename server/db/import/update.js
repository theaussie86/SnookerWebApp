require('./../../config/config');

const {mongoose} = require('./../mongoose');
const {Rent} = require('./../../models/rent');
const {Break} = require('./../../models/break');
const {User} = require('./../../models/user');
const {members, tischmiete, breaks}= require('./snookerdata');

module.exports.updateBreaksAndRents= ()=>{
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

module.exports.updateOldIds = () => {
    User.update({},{$unset:{mitID:''}},{multi: true}).exec();
    Rent.update({},{$unset:{mitID:''}},{multi: true}).exec();
    Break.update({},{$unset:{mitID:''}},{multi: true}).exec(); 
    console.log('Alle alten IDs wurden gelöscht');
};

module.exports.fillBills=()=>{
    Rent.find({}, (err, rents)=>{
        if (err) throw err;
    }).cursor().on('data',(rent)=>{
        var monat = rent.datum.getMonth();
        var jahr = rent.datum.getYear();
        User.findOne({
            _id: rent._member,
            'bills.month': monat,
            'bills.year': jahr
        }).then((user)=>{
            if (!user) {
                return console.log('Kein User gefunden.');
            }
            return console.log(user);
        }).catch((e)=>{
            return console.log(e);
        });
    });
}