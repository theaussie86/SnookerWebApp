require('./config/config');

const express = require('express');
const morgan = require('morgan');
const path = require('path');
const hbs = require('hbs');
const bodyParser = require('body-parser');
const session = require('express-session');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const flash = require('connect-flash');
const passport = require('passport');
const MongoStore = require('connect-mongo')(session);
const nodemailer = require('nodemailer');
const async = require('async');
const crypto = require('crypto');
const validator = require('express-validator');
const moment = require('moment');
const multer = require('multer');
const fs = require('fs');

const publicPath = path.join(__dirname,'../public');
const {mongoose} = require('./db/mongoose');
const {User} = require('./models/user');
const {Break} = require('./models/break');
const {Rent} = require('./models/rent');
const {router}=require('./routes/index');
const {memberroutes}=require('./routes/member');
const {dataroutes}=require('./routes/data');
const {boardroutes}=require('./routes/board');
const {isLoggedIn, isAdmin, CheckLoginForm, CheckRegisterForm} = require('./middleware/authenticate');

// Set Storage Engine
const storage = multer.diskStorage({
    destination: './public/img/',
    filename: function(req, file,cb){
        cb(null,req.user.username+'-'+Date.now()+path.extname(file.originalname));
    }
});

// Init Upload
const upload = multer({
    storage: storage,
    limits:{fileSize:1000000},
    fileFilter: function(req,file,cb){
        checkFileType(file,cb);
    }
}).single('uploadPic');

// Check File Type
function checkFileType(file,cb){
    // Allowed extensions
    const filetypes = /jpeg|jpg|png|gif/;
    // Check Ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check Mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname){
        return cb(null, true);
    } else {
        cb('ERROR: Nur Bilder!');
    }
}

// init app
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
app.use('/',router);
app.use('/members',memberroutes);
app.use('/data',dataroutes);
app.use('/board',boardroutes);

// Middleware hbs
app.set('views',publicPath+'/views');
hbs.registerPartials(publicPath+ '/views/partials');
app.set('view engine','hbs');

// app.use((req, res, next) => {
//     res.render('maintenance.hbs');
// });

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

// UPLOAD
app.post('/upload',isLoggedIn,(req, res)=>{
    upload(req,res,(err)=>{
        if(err){
            req.flash('error_msg',`${err}`);
            res.redirect('/data/profile');
        } else {
            if(req.file == undefined){
                req.flash('error_msg',`ERROR: Keine Datei ausgesucht!`);
                res.redirect('/data/profile');
            } else{
                User.findById(req.user._id,'bild').then((user)=>{
                    if(!user.bild) {
                        user.bild = req.file.filename;
                        user.save();
                        req.flash('success_msg',`Neues Bild hochgeladen`);
                        res.redirect('/data/profile');
                    } else {
                        var path = `./public/img/${user.bild}`;
                        fs.stat(path, function(err,stats) {
                            if(err){
                                req.flash('error_msg',`ERROR: ${err}`);
                                res.redirect('/data/profile');
                            } else{
                                fs.unlink(path,function(err){
                                    if(err) return console.log(err);
                                    console.log('file deleted successfully');
                                });
                                user.bild = req.file.filename;
                                user.save();
                                req.flash('success_msg',`Neues Bild hochgeladen`);
                                res.redirect('/data/profile');
                            }
                        });
                    }
                }).catch((e)=>{
                    req.flash('error_msg',`${e}`);
                    res.redirect('/data/profile');
                });
            }
        }
    });
});

app.listen(app.get('port'), () => {
    console.log(`Server started on port ${app.get('port')}`);
});

module.exports = {app, passport, validator};