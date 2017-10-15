require('./config/config');

const express = require('express');
const path = require('path');
const hbs = require('hbs');
const bodyParser = require('body-parser');
const {ObjectID}=require('mongodb');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const publicPath = path.join(__dirname,'../public');
const {mongoose} = require('./db/mongoose');
const {User} = require('./models/user');
const {Rent} = require('./models/rent');
const {authenticate} = require('./middleware/authenticate');


var app = express();

app.use(bodyParser.json());
const port = process.env.PORT || 3000;

app.set('views',publicPath+'/views');
hbs.registerPartials(publicPath+ '/views/partials');
app.set('view engine','hbs');

app.use((req, res, next) => {
    var now = new Date().toString();
    var log = `${now}: ${req.method} ${req.url}`;

    fs.appendFile('server.log',log + '\n', (err) => {
        if (err) console.log('Unable to append to server.log.');
    });
    next();
});

// app.use((req, res, next) => {
//     res.render('maintenance.hbs');
// });

app.use(express.static(publicPath));

hbs.registerHelper('getCurrentYear',() => {
    return new Date().getFullYear();
});

app.get('/', (req, res) =>{
    res.render('home.hbs',{
        title: 'Home'
    });
});

app.get('/members', (req, res) =>{
    res.render('members.hbs',{
        title: 'Members'
    });
});

app.get('/board', (req, res) =>{
    res.render('board.hbs',{
        title: 'Vorstand'
    });
});

app.get('/about', (req, res) =>{
    res.render('about.hbs',{
        title: 'Impressum'
    });
});

app.get('/maintenance', (req, res) =>{
    res.render('maintenance.hbs',{
        title: 'Wartung'
    });
});

// User routes
app.get('/users', (req,res) => {
    User.find().then((users) => {
        res.send({users});
    },(err) => {
        res.status(400).send(err);
    });

});

app.post('/users', (req,res) => {
    var body = _.pick(req.body, ['email','password','username']);
    var user = new User (body);

    user.save().then(() => {
        return user.generateAuthToken();
    }).then((token) =>{
        res.header('x-auth', token).send(user);
    }).catch((err)=>{
        res.status(400).send(err);
    });
});

app.get('/users/me', authenticate, (req,res)=>{
    res.send(req.user);
});

app.post('/users/login', (req, res)=>{
    var body = _.pick(req.body,['email','password']);

    User.findByCredentials(body.email,body.password).then((user)=>{
        return user.generateAuthToken().then((token)=>{
            res.header('x-auth', token).send(user);            
        });
    }).catch((e)=>{
        res.status(400).send();
    });
});

app.delete('/users/me/token', authenticate, (req, res)=>{
    req.user.removeByToken(req.token).then(()=>{
        res.status(200).send();
    }, ()=>{
        res.send(400).send();
    });
});

// Rent routes
app.post('/rents', authenticate, (req, res)=>{
    var rent = new Rent({
        datum: new Date(req.body.datum),
        player1: req.body.player1,
        player2: req.body.player2,
        start: new Date(`1899-12-30T${req.body.start}:00Z`),
        ende: new Date(`1899-12-30T${req.body.ende}:00Z`),
        _member: req.user._id  
    });

    rent.save().then((doc)=>{
        res.send(doc);
    }, (err)=>{
        res.status(400).send(err);
    });
});

app.get('/rents', authenticate, (req,res)=>{
    Rent.find({
        _member: req.user._id
    }).then((rents)=>{
        res.send({rents});
    }, (err)=>{
        res.status(400).send(err);
    });
});

app.get('/rents/:id', authenticate,(req,res)=>{
    var id=req.params.id;

    if (!ObjectID.isValid(id)) {
        return res.status(404).send();
    }
    Rent.findOne({
        _id: id,
        _member: req.user._id
    }).then((rent)=>{
        if (!rent){
            return res.status(404).send();
        }

        res.send({rent});
    }).catch((e)=>{
        res.status(400).send();
    });
});

app.delete('/rents/:id', authenticate,(req,res)=>{
    var id=req.params.id;

    if (!ObjectID.isValid(id)){
        return res.status(404).send();
    }
    Rent.findOneAndRemove({
        _id: id,
        _member: req.user._id
    }).then((rent)=>{
        if (!rent){
            return res.status(404).send();
        }
        res.send({rent});
    }).catch((err)=>{
        res.status(400).send(err);
    });
});

app.patch('/rents/:id', authenticate,(req,res)=>{
    var id= req.params.id;
    var body= _.pick(req.body,['datum','paid']);

    if (!ObjectID.isValid(id)){
        return res.status(404).send();
    }

    if (_.isBoolean(body.paid)&&body.paid){
        body.datum = new Date("2017-09-15T22:00:00.000Z");
    } else {
        body.paid=false;
        body.datum=null;
    }

    Rent.findOneAndUpdate({
        _id: id,
        _member: req.user._id
    },{$set:body},{new: true}).then((rent)=>{
        if (!rent){
            return res.status(404).send();
        }

        res.send({rent});
    }).catch((e)=>{
        res.status(400).send();
    });
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

module.exports = {app};