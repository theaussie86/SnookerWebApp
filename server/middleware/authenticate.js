const {User} = require('./../models/user');

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
    // res.redirect('/members');
    next()
}

module.exports= {isLoggedIn, isAdmin};