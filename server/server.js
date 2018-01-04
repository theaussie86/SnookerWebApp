require('./config/config');

const express = require('express');
const morgan = require('morgan');
const path = require('path');
const hbs = require('hbs');
const bodyParser = require('body-parser');
const session = require('express-session');
const {ObjectID}=require('mongodb');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const flash = require('connect-flash');
const passport = require('passport');
const MongoStore = require('connect-mongo')(session);
const nodemailer = require('nodemailer');
const async = require('async');
const crypto = require('crypto');
const validator = require('express-validator');
const moment = require('moment');

const publicPath = path.join(__dirname,'../public');
const {mongoose} = require('./db/mongoose');
const {User} = require('./models/user');
const {Break} = require('./models/break');
const {Rent} = require('./models/rent');
const {importRouter} = require('./routes/import');
const {router}=require('./routes/index');
const {memberroutes}=require('./routes/member');
const {dataroutes}=require('./routes/data');
const {boardroutes}=require('./routes/board');
const {isLoggedIn, isAdmin, CheckLoginForm, CheckRegisterForm} = require('./middleware/authenticate');
const {fillBills} = require('./db/import/update');

var app = express();

// Middleware
app.use(morgan('dev'));
app.use(session({
    secret: process.env.JWT_SECRET,
    saveUninitialized: false,
    resave: false,
    store: new MongoStore({
        mongooseConnection: mongoose.connection,
        ttl: 7*24*60*60,
        autoRemove:'native'
    })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Global Variables for flash
app.use((req, res, next)=>{
    res.locals.success_msg = req.flash('success_msg');
    res.locals.info_msg = req.flash('info_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

// Passport Middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(validator());
app.set('port', (process.env.PORT || 3000));
require('./middleware/passport')(passport);

// Middleware for Routes
app.use('/import',importRouter);
app.use('/',router);
app.use('/members',memberroutes);
app.use('/data',dataroutes);
app.use('/board',boardroutes);

// Middleware hbs
app.set('views',publicPath+'/views');
hbs.registerPartials(publicPath+ '/views/partials');
app.set('view engine','hbs');

// server log
app.use((req, res, next) => {
    var now = new Date().toString();
    var log = `${now}: ${req.method} ${req.url}`;

    fs.appendFile('server.log',log + '\n', (err) => {
        if (err) console.log('Unable to append to server.log.');
    });
    next();
});

app.use((req, res, next) => {
    res.render('maintenance.hbs');
});

app.use(express.static(publicPath));

moment.locale('de');

// Handlebars Helpers
hbs.registerHelper('getCurrentYear',() => {
    return new Date().getFullYear();
});

hbs.registerHelper('formatDate',(date)=>{
    if (moment(date).unix()===0){
        return "";
    } else {
        return moment(date).format('DD.MM.YYYY');
    }
});

hbs.registerHelper('formatMonthYear',(date)=>{
    return moment(date).format('MMMM YYYY');
});

hbs.registerHelper('formatCurrency',(num)=>{
    return num.toFixed(2).replace('.',',')+' €';
});

hbs.registerHelper('ifCond', function(v1, v2, options) {
    if(v1 && v2) {
      return options.fn(this);
    }
    return options.inverse(this);
});

hbs.registerHelper('inc',(index)=>{
    return index+1;
});

// LOGIN

app.post('/login', CheckLoginForm, passport.authenticate('login',{
    successRedirect: '/members',
    failureRedirect: '/login',
    failureFlash: true
}));

// REGISTER
    
app.post('/register', CheckRegisterForm, passport.authenticate('register',{
    successRedirect: '/members',
    failureRedirect: '/register',
    failureFlash: true
}));

app.listen(app.get('port'), () => {
    console.log(`Server started on port ${app.get('port')}`);
});

module.exports = {app, passport, validator};