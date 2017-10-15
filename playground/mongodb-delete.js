// const MongoClient = require('mongodb').MongoClient;
const {MongoClient, ObjectID} = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/ToDoApp',(err, db) => {
    if (err) {
        return console.log('Unable to connect to MongoDB server');
    }
    console.log('Connected to MongoDB server');

    // deleteMany

    // db.collection('Users').deleteMany({name: 'Marian'}).then((result) => {
    //     console.log(result);
    // }, (err) => {
    //     console.log('Unable to find any Documents.');
    // });

    // deleteOne

    // db.collection('ToDos').deleteOne({text: 'eat lunch'}).then((result) => {
    //     console.log(result);
    // }, (err) => {
    //     console.log('Unable to find any Documents.');
    // });

    // findOneAndDelete
    db.collection('Users').findOneAndDelete({_id: new ObjectID("59be1822bb315e1f588b8f04")}).then((result) => {
        console.log(result);
    }, (err) => {
        console.log('Unable to find any Documents.');
    });    

    //db.close();
});