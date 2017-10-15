// const MongoClient = require('mongodb').MongoClient;
const {MongoClient, ObjectID} = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/ToDoApp',(err, db) => {
    if (err) {
        return console.log('Unable to connect to MongoDB server');
    }
    console.log('Connected to MongoDB server');

    // db.collection('ToDos').find({completed: false}).toArray().then((docs)=>{
    //     console.log('ToDos');
    //     console.log(JSON.stringify(docs, undefined, 2));
    // },(err)=>{
    //     console.log('Unable to fetch ToDos', err);
    // });

    // db.collection('ToDos').find().count().then((count)=>{
    //     console.log('ToDos: ',count);
    // },(err)=>{
    //     console.log('Unable to fetch ToDos', err);
    // });

    db.collection('Users').find({name: 'Liam'}).count().then((count)=>{
        console.log('Users with the name of Liam: ',count);
    }, (err) => {
        console.log('Unable to fetch Users', err);
    });

    //db.close();
});