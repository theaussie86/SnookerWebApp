const db = require('./../db/snookerdb');
var members = db.tblMitglieder;
const memberships = db.tblMitgliedschaften;
const beitrag = db.tblBeitrag;
const kTyp = db.tblKontakttyp;
const kDaten = db.tblKontaktdaten;
const tischmiete = db.tblTischmiete;
const breaks = db.tblBreaks;


members.forEach(function(member) {
    // Mitgliedschaften und Beiträge
    memberships.forEach(function(mship) {
        if (mship.mit_id_f === member.mit_id) {
            member.mgl_anf = Date.parse(mship.mgl_anf);
            member.mgl_end = Date.parse(mship.mgl_end)|| 0;
            beitrag.forEach(function(beit) {
                if (mship.bei_id_f === beit.bei_id) {
                    member.Mitgliedschaft =beit.bei_art;
                    member.Beitrag =beit.bei_wert;                    
                }
            }, this);
        }

    });
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

module.exports = {members, tischmiete, breaks};

