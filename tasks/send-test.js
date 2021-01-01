require('./../server/config/config');

const moment = require('moment');
const _ = require('lodash');
const nodemailer = require('nodemailer');
const { MongoClient, ObjectID } = require('mongodb');

moment.locale('de');

// let datum = new Date(Date.UTC(new Date().getFullYear(),new Date().getMonth(),0,12));

// MongoClient.connect(process.env.MONGODB_URI,(err, db) => {
//     if (err) return console.log('Unable to connect to MongoDB server.');        

//     db.collection('users').find({username:'Murat'}).toArray().then((users)=>{
//         users = users.filter((x)=>{
//             return (x.aktiv || x.isBoardMember);
//         }).forEach((user)=>{
//             if (user.email.indexOf('@fake.com')=== -1) {
//                 user= _.pick(user,['username','email','_id','bills']);
//                 var str = '';
//                 user.bills.forEach((bill) => {
//                     str+=`${moment(bill.billDate).format('MMMM YYYY')}:\thttp://afternoon-sea-42864.herokuapp.com/data/bill/${user._id}/${bill._id}\n`;
//                 });
// console.log(process.env)

var smtpTransport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: process.env.ACCESS_TOKEN,
        expires: process.env.EXPIRY_DATE,
    }
});
var mailOptions = {
    to: 'chmurat86@gmail.com',
    from: 'snookertempel@gmail.com',
    subject: `Allgemeine Information zu den Rechnungen`,
    text: `Hallo Test,\n\n` +
        `da es momentan ein bisschen umständlich ist, sich seine Rechnungen herunter zu laden, weil man sich dafür extra einloggen muss,\n` +
        `habe ich für die Zukunft einen Downloadlink in die Rechnungsemail integriert.\n` +
        `Damit kannst du dir mit einem Klick die komplette Rechnung herunterladen.\n\n` +
        `Für den einfachen Download deiner alten Rechnungen, habe ich dir im folgenden alle bisherigen Downloadlinks zusammengefasst:\n` +
        `Mit freundlichem Gruß Murat\n
                            Snookerclub Neubrandenburg`
};
smtpTransport.sendMail(mailOptions, function (err, info) {
    if (err) {
        console.error(err);
    } else {
        return console.log(info);
    }
});
    //             }
    //         });
    //         return;
    //     }).catch((e)=> console.log(e));
    // });

