const db = require('./../snookerdb');
var members = db.tblMitglieder;
const memberships = db.tblMitgliedschaften;
const beitrag = db.tblBeitrag;
const kTyp = db.tblKontakttyp;
const kDaten = db.tblKontaktdaten;
const tischmiete = db.tblTischmiete;
const breaks = db.tblBreaks;


members.forEach(function(member) {
    // Mitgliedschaften und Beiträge
    member.memberships =[];
    memberships.forEach(function(mship) {
        var obj={};
        if (mship.mit_id_f === member.mit_id) {
            obj.mgl_anf = Date.parse(mship.mgl_anf)+43200000;
            obj.mgl_end = Date.parse(mship.mgl_end)+43200000|| 0;
            beitrag.forEach(function(beit) {
                if (mship.bei_id_f === beit.bei_id) {
                    obj.Mitgliedschaft =beit.bei_art;
                    obj.Beitrag =beit.bei_wert;                    
                }
            }, this);
            
            member.memberships.push(obj);
            
        }

    },this);
    // Kontaktdaten
    kDaten.forEach(function(set) {
        if (set.mit_id_f === member.mit_id) {
            if (set.ktyp_id_f ==='1') {
                member.Email = set.kdat_wert;
            } else if (set.ktyp_id_f === '2') {
                member.Handy = set.kdat_wert;
            } else if (set.ktyp_id_f === '3') {
                member.Festnetz = set.kdat_wert;
            }
        }
    }, this);
});

breaks.forEach((b) => {
    b.brk_date=Date.parse(b.brk_date)+43200000;
});

tischmiete.forEach((t) => {
    var name = "";
    t.tim_date=Date.parse(t.tim_date)+43200000;
    members.forEach((m) => {
        if (m.mit_id === t.mit_id_f){
            return name = m.mit_spname;
        }
    });
    if (t.tim_spieler1=== name || t.tim_spieler2===name){
        t.onlyGuests = false;
    } else {
        t.onlyGuests = true;
    }
});


module.exports = {members, tischmiete, breaks};

