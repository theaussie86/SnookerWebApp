const {MongoClient, ObjectID} = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/SnookerDB', (err, db) => {
    if (err) {
        return console.log('Unable to connect to MongoDB server. '+err);
    }
    var vdate = new Date(2015,3,0,12);
    console.log('Connected to MongoDB server');

    db.collection('users').update({
        username: 'Murat',
        'bills.billDate': vdate
    },{
        $set:{'bills.$.feePaid':false}
    },false,true);

    // db.close();

});