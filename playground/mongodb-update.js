const {MongoClient, ObjectID} = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/SnookerDB', (err, db) => {
    if (err) {
        return console.log('Unable to connect to MongoDB server');
    }
    console.log('Connected to MongoDB server');

    db.collection('users').find().forEach.call(function(user) {
        return db.collection('breaks').update({'mitID': user.mitID},{$set:{'_member': user._id}},{multi:true});
         
    }, this);

    // db.close();

});