require('./../server/config/config');

// const MongoClient = require('mongodb').MongoClient;
const {MongoClient, ObjectID} = require('mongodb');
const moment = require('moment');
const async = require('async');

let vdate = new Date(2018,2,0,12);

moment.locale('de');

async.waterfall([
    async.apply(getParams,vdate)
],(err, result)=>{
    if (err) throw err;

});

function getParams(datum, callback){
    let params = [];
    MongoClient.connect(process.env.MONGODB_URI,(err, db) => {
        if (err) {
            return console.log('Unable to connect to MongoDB server');
        }
    
        db.collection('users').find({}).toArray().then((users)=>{
            users.forEach((user) => {
                // if (!user.aktiv) return;
                if (user.bills[user.bills.length-1].billDate>=datum) return;
                var out = {username: user.username,bills:[]};
                var enddate = user.bills[user.bills.length-1].billDate || new Date(Date.UTC(2015,0,0,12));
                console.log(enddate);
                while (enddate <= datum) {
                    enddate.setMonth(enddate.getMonth()+1);
                    // console.log(enddate);
                    bdate = enddate;
                    var idx = user.memberships.map((x)=>x.membershipEnd).indexOf(enddate);
                    var beitrag;
                    if (idx>=0) {
                        beitrag = 0;
                    } else {
                        var mdate = new Date(enddate.getFullYear(),enddate.getMonth()+2,0,12);
                        idx = user.memberships.findIndex((m)=>{
                            return m.membershipStart<mdate && (m.membershipEnd>=mdate || m.membershipEnd.getTime() === 0);
                        });
                        if (idx === -1){
                            continue;
                        } else {
                            beitrag=user.memberships[idx].membershipFee;
                        }
                    }
                    out.bills.push({
                        billDate: new Date(Date.UTC(enddate.getFullYear(),enddate.getMonth()+1,0,12)),
                        beitrag:beitrag
                    });
                };
                console.log(out);
                params.push(out);
            });
            // console.log(params);
            callback(null, params);
        }, (err) => {
            console.log('Unable to fetch Users', err);
        });    
        db.close();
    });
}
