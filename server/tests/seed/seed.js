const {ObjectID}=require('mongodb');
const jwt = require('jsonwebtoken');

const {Rent} = require('./../../models/rent');
const {User} = require('./../../models/user');


const userOneId = new ObjectID();
const userTwoId = new ObjectID();
const users = [{
    _id: userOneId,
    email: 'hallo@du.com',
    username: 'Hans',
    password: 'userOnePass',
    tokens: [{
        access: 'auth',
        token: jwt.sign({_id: userOneId, access: 'auth'}, process.env.JWT_SECRET).toString()
    }]
},
{
    _id: userTwoId,
    email: 'fettes@ding.de',
    username: 'Heidi',
    password: 'userTwoPass',
    tokens: [{
        access: 'auth',
        token: jwt.sign({_id: userTwoId, access: 'auth'}, process.env.JWT_SECRET).toString()
    }]
}];

const rents = [{
    _id: new ObjectID(),
    datum: "9.1.2017",
    player1: "Robin",
    player2: "Murat",
    start: "1899-12-30T12:30:00",
    ende: "1899-12-30T14:15:00",
    paid: true,
    _member: userOneId
},
{
    _id: new ObjectID(),
    datum: "9.16.2017",
    player1: "Marian",
    player2: "Murat",
    start: "1899-12-30T22:30:00",
    ende: "1899-12-30T00:45:00",
    _member: userTwoId
}];

const populateRents = (done)=>{
    Rent.remove({}).then(()=>{
        return Rent.insertMany(rents);
    }).then(()=>done());
};

const populateUsers = (done)=>{
    User.remove({}).then(()=>{
        var userOne = new User(users[0]).save();
        var userTwo = new User(users[1]).save();

        return Promise.all([userOne, userTwo]);
    }).then(()=>done());
};

module.exports={rents, populateRents, users, populateUsers};