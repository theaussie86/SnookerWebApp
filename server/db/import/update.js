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

// Import der alten Daten
// app.get('/import', (req,res)=>{
//     importSQLData();

//     res.render('login.hbs',{'success_msg':'Alle Daten importiert'});
// });

// app.get('/update',(req, res)=>{
//     Break.findOne({player: 'Murat'}).then((serie)=>{
        
//             if (serie.mitID&&!serie._member){
//                 console.log('_member ist noch nicht gesetzt');
//                 updateBreaksAndRents();
//                 res.render('login.hbs',{'success_msg':'_member ist noch nicht gesetzt'});
                
//             } else if (serie.mitID&&serie._member){
//                 console.log('_member ist schon gesetzt, aber mitID gibt es noch');
//                 updateOldIds();
//                 res.render('login.hbs',{'success_msg':'_member ist schon gesetzt, aber mitID gibt es noch'});
                
//             } else if (!serie.mitID&&serie._member){
//                 console.log('Alles richtig gesetzt');
//                 res.render('login.hbs',{'success_msg':'Alles richtig gesetzt'});
                
//             } else {
//                 console.log('Hier stimmt was nicht');
//                 throw new Error('Hier stimmt was nicht');
//                 res.render('login.hbs',{'error_msg':'Alle Daten importiert'});
                
//             }
        
//         }).catch((e)=>{
//             console.log(e);
//             res.render('login.hbs',{'error_msg':e});
//         });
// });



