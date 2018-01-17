const {MongoClient, ObjectID} = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/SnookerDB', (err, db) => {
    if (err) {
        return console.log('Unable to connect to MongoDB server. '+err);
    }

    db.collection('users').updateMany({},{
        $set: {bills:[]}
    });

    db.close();

});