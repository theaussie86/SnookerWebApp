require('../server/config/config');

const moment = require('moment');
const { MongoClient, ObjectID } = require('mongodb');
const MongoOptions = {
    useUnifiedTopology: true,
    useNewUrlParser: true
}
const dbName = 'SnookerClubDb'

moment.locale('de');

let vdate = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), 0, 12));

updateUserBills(vdate)


async function updateUserBills(datum) {
    try {
        // Connect to Database
        const client = await MongoClient.connect(process.env.MONGODB_URI, MongoOptions)
        const db = await client.db(dbName)

        // Get all Active Members and create a new Bill
        let data = [];
        console.log('+++++++++++++++++++++  Sammle Daten ein...');
        const users = await db.collection('users').find({}).toArray()
        users.forEach((user) => {
            let enddate;
            if (user.bills.length === 0) {
                enddate = new Date(Date.UTC(2015, 0, 0, 12));
            } else {
                enddate = user.bills[user.bills.length - 1].billDate;
                if (user.bills[user.bills.length - 1].billDate >= datum) return;
            }
            let out = { id: ObjectID(user._id), bills: [] };
            while (enddate < datum) {
                enddate = new Date(Date.UTC(enddate.getFullYear(), enddate.getMonth() + 2, 0, 12));
                let idx = user.memberships.map((x) => x.membershipEnd.getTime()).indexOf(enddate.getTime());
                let beitrag;
                if (idx >= 0) {
                    if (idx === user.memberships.length - 1) beitrag = 0; else beitrag = user.memberships[idx + 1].membershipFee;
                } else {
                    var mdate = new Date(enddate.getFullYear(), enddate.getMonth() + 2, 0, 12);
                    idx = user.memberships.findIndex((m) => {
                        return m.membershipStart < mdate && (m.membershipEnd >= mdate || m.membershipEnd.getTime() === 0);
                    });
                    if (idx === -1) {
                        continue;
                    } else {
                        beitrag = user.memberships[idx].membershipFee;
                    }
                }
                out.bills.push({
                    billDate: new Date(Date.UTC(enddate.getFullYear(), enddate.getMonth() + 1, 0, 12)),
                    membershipFee: beitrag,
                    feePaid: beitrag === 0 ? true : false,
                    _id: new ObjectID()
                });
            };
            if (out.bills.length > 0) data.push(out);
        });

        // Stop if no new bills are found
        if (data.length > 0) {
            // Get Sales of current month
            console.log('+++++++++++++++++++++  Ermittle Gastumsätze...');
            const rents = await db.collection('rents').find({}).toArray()

            // Update Data to be updated
            for (user of data) {
                // Update Sales in Bills
                user.bills.forEach((bill, j) => {
                    var sales = rents.filter((x) => {
                        return (x._member.equals(user.id)) && (x.datum.getMonth() === bill.billDate.getMonth()) && (x.datum.getFullYear() === bill.billDate.getFullYear());
                    }).map((x) => {
                        var guests = 1;
                        if (x.onlyGuests) guests = 2;
                        return Math.ceil((x.ende - x.start) * 3.5 / 360000) * guests * 10;
                    }).reduce((a, b) => a + b, 0) / 100;
                    user.bills[j].salesPaid = sales === 0 ? true : false;
                    user.bills[j].visitorsSales = sales;
                });

                //Save Document
                const res = await db.collection('users').updateOne({ _id: user.id }, {
                    $push: { bills: { $each: user.bills } }
                })
                console.log(res)
            }

            console.log('+++++++++++++++++++++  Rechnungen abgespeichert!');
        } else console.log('+++++++++++++++++++++  Alles Aktuell...');



        client.close()
        // console.log(data)
    } catch (error) {
        console.error(error)
        process.exit(-1)
    } finally { console.log('------ Rechnungserstellung abgeschlossen --------') }

};

function getSales(queryParams, callback) {
    console.log('+++++++++++++++++++++  Ermittle Gastumsätze...');
    MongoClient.connect(process.env.MONGODB_URI, (err, db) => {
        if (err) return callback('Unable to connect to MongoDB server.');

        db.collection('rents').find({}).toArray().then((rents) => {
            queryParams.forEach((user, i) => {
                user.bills.forEach((bill, j) => {
                    var sales = rents.filter((x) => {
                        return (x._member.equals(user.id)) && (x.datum.getMonth() === bill.billDate.getMonth()) && (x.datum.getFullYear() === bill.billDate.getFullYear());
                    }).map((x) => {
                        var guests = 1;
                        if (x.onlyGuests) guests = 2;
                        return Math.ceil((x.ende - x.start) * 3.5 / 360000) * guests * 10;
                    }).reduce((a, b) => a + b, 0) / 100;
                    queryParams[i].bills[j].salesPaid = sales === 0 ? true : false;
                    queryParams[i].bills[j].visitorsSales = sales;

                });
            });
            callback(null, queryParams);
            db.close();
            console.log('+++++++++++++++++++++  Gastumsätze ermittelt!');
        }, (e) => {
            return callback('Unable to fetch Rents. ' + e);
        });

    });
}

function getParams(datum, callback) {

    let params = [];
    console.log('+++++++++++++++++++++  Sammle Daten ein...');
    MongoClient.connect(process.env.MONGODB_URI, (err, db) => {
        if (err) return callback('Unable to connect to MongoDB server.');


        db.collection('users').find({}).toArray().then((users) => {
            users.forEach((user) => {
                var enddate;
                if (user.bills.length === 0) {
                    enddate = new Date(Date.UTC(2015, 0, 0, 12));
                } else {
                    enddate = user.bills[user.bills.length - 1].billDate;
                    if (user.bills[user.bills.length - 1].billDate >= datum) return;
                }
                var out = { id: ObjectID(user._id), bills: [] };
                while (enddate < datum) {
                    enddate = new Date(Date.UTC(enddate.getFullYear(), enddate.getMonth() + 2, 0, 12));
                    var idx = user.memberships.map((x) => x.membershipEnd.getTime()).indexOf(enddate.getTime());
                    var beitrag;
                    if (idx >= 0) {
                        if (idx === user.memberships.length - 1) beitrag = 0; else beitrag = user.memberships[idx + 1].membershipFee;
                    } else {
                        var mdate = new Date(enddate.getFullYear(), enddate.getMonth() + 2, 0, 12);
                        idx = user.memberships.findIndex((m) => {
                            return m.membershipStart < mdate && (m.membershipEnd >= mdate || m.membershipEnd.getTime() === 0);
                        });
                        if (idx === -1) {
                            continue;
                        } else {
                            beitrag = user.memberships[idx].membershipFee;
                        }
                    }
                    out.bills.push({
                        billDate: new Date(Date.UTC(enddate.getFullYear(), enddate.getMonth() + 1, 0, 12)),
                        membershipFee: beitrag,
                        feePaid: beitrag === 0 ? true : false,
                        _id: new ObjectID()
                    });
                };
                if (out.bills.length > 0) params.push(out);
            });
            if (params.length === 0) {
                db.close();
                return callback('------ Alle Rechnungen sind auf dem neuesten Stand -------');
            } else {
                callback(null, params);
                db.close();
                console.log(`+++++++++++++++++++++  Daten für ${params.length} User eingesammelt!`);
            }
        }).catch((e) => callback(e));
    });
}
