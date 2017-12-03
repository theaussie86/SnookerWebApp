require('./../../config/config');
const {ObjectId} = require('mongoose');

var {mongoose} = require('./../mongoose');
var {Rent} = require('./../../models/rent');
var {Break} = require('./../../models/break');
var {User} = require('./../../models/user');
var {members, tischmiete, breaks}= require('./snookerdata');
module.exports.importSQLData=()=>{
//Befüllen der users-Collection
members.forEach(function(m) {

    var user = new User({
        username: m.mit_spname,
        email: m.Email || `${m.mit_spname}@fake.com`,
        password: m.mit_vorn,
        firstname: m.mit_vorn,
        lastname: m.mit_nach,
        street: m.mit_str,
        zip: m.mit_plz,
        city: m.mit_ort,
        mitID: m.mit_id
    });

    m.memberships.forEach(function(mship){
        if (mship.mgl_end !== 0){
            user.aktiv = false
        } else {
            user.aktiv = true
        }
        user.memberships.push({
            membershipType : mship.Mitgliedschaft,
            membershipFee: mship.Beitrag,
            membershipStart: mship.mgl_anf,
            membershipEnd: mship.mgl_end
        });
    });

    if (m.mit_spname==="Marian"||m.mit_spname==="Robert"||m.mit_spname==="Öschi" ||m.mit_spname==="Murat"){
        user.isBoardMember = true;
    }

    if (m.Handy) {
        user.handy= m.Handy;
    }
    
    user.save().then((doc) => {
        console.log(`${user.username} mit ID: ${user._id} abgespeichert.`);
    }, (err)=> {
        console.log(err);
    });
    
}, this);

//Befüllen der rents-Collection
tischmiete.forEach(function(r) {
    var rent = new Rent({
        mitID: r.mit_id_f,
        datum: new Date(r.tim_date),
        player1: r.tim_spieler1,
        player2: r.tim_spieler2,
        start: new Date(r.tim_anf),
        ende: new Date(r.tim_end),
        onlyGuests: r.onlyGuests,
        _member: new mongoose.Types.ObjectId()
    });

    if (rent.ende<rent.start){
        console.log('Endzeit um einen Tag erhöht.');
        rent.ende.setDate(rent.ende.getDate()+1);
    }
    rent.save().then((doc)=>{
        console.log('SAVED: '+r.tim_spieler1+' - '+r.tim_spieler2);
    }, (err) =>{
        console.log(err);
    });
}, this);


// Befüllen der breaks-collection
breaks.forEach(function(b) {
        var serie = new Break({
            datum: b.brk_date,
            player: b.brk_spieler,
            break: b.brk_hoehe,
            remark: b.brk_bemerkung,
            mitID: b.mit_id_f
        });
        serie.save().then((doc) =>{
            console.log(`Break ${doc.break} von ${doc.player} abgespeichert.`)
        }, (err)=>{
            console.log(err);
        });

}, this);
}
