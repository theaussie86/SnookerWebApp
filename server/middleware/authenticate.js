const {User} = require('./../models/user');

// var authenticate = (req, res, next)=>{
//     if(req.user){
//         var token = req.user.tokens[0].token;
//     }

//         User.findByToken(token).then((user)=>{
//             if (!user){
//                 return Promise.reject();
//             }
//             req.user = user;
//             req.token = token;
//             next();
//         }).catch((err)=>{
//             res.status(401).render('home.hbs',{message: 'Kein Zugriff. Erst Einloggen.'});
//         });
// };

var isLoggedIn = (req, res, next)=>{
    if (req.isAuthenticated()){
        return next();
    }
    req.flash('error','Du bist nicht eingeloggt.');
    res.redirect('/login');
}

var isAdmin = (req, res, next)=>{
    if (req.isAuthenticated()&&req.user.isBoardMember){
        return next();
    }
    req.flash('error_msg','Du bist kein Admin. Das darfst du nicht!!!');
    res.redirect('/members');
}

module.exports= {isLoggedIn, isAdmin};