const validator = require('express-validator');

var isLoggedIn = (req, res, next)=>{
    if (req.isAuthenticated()){
        return next();
    }
    req.flash('error_msg','Du bist nicht eingeloggt.');            
    res.redirect('/login');
}

var isAdmin = (req, res, next)=>{
    if (req.isAuthenticated()&&req.user.isBoardMember){
        return next();
    }
    req.flash('error_msg','Du bist kein Admin. Das darfst du nicht!!!');
    res.redirect('/members');

}

var CheckLoginForm = (req, res, next)=>{
    req.checkBody('username','Der Benutzername darf nicht leer sein.').notEmpty();
    req.checkBody('password','Das Passwort darf nicht leer sein.').notEmpty();
    
        var errors = req.validationErrors();
        if (errors) {
            // Render the form using error information
            res.render('login.hbs',{errors: errors});
        }
        else {
            // There are no errors so perform action with valid data (e.g. save record).
            next();
        }
}

var CheckRegisterForm = (req, res, next)=>{
    req.checkBody('username','Der Benutzername darf nicht leer sein.').notEmpty();
    req.checkBody('email','Bitte geben Sie eine Emailadresse an.').notEmpty();
    req.checkBody('password','Das Passwort darf nicht leer sein.').notEmpty();
    req.checkBody('password','Das Passwort muss mindestens eine Ziffer und einen Buchstaben enthalten und mindestens 6 Zeichen lang sein.')
        .matches(/^(?=.*\d)(?=.*[a-z])[0-9a-zA-Z]{6,}$/, "i");
    req.checkBody('password2','Die Passwörter müssen überein stimmen.').equals(req.body.password);      
    
    
        var errors = req.validationErrors();
        if (errors) {
            // Render the form using error information
            res.render('register.hbs',{errors: errors});
        }
        else {
            // There are no errors so perform action with valid data (e.g. save record).
            next();
        }
}

module.exports= {isLoggedIn, isAdmin, CheckLoginForm, CheckRegisterForm};