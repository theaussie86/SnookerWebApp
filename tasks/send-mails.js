require('./../server/config/config');

const moment = require('moment');
const _ = require('lodash');
const nodemailer = require('nodemailer');
const { MongoClient, ObjectID } = require('mongodb');
const MongoOptions = {
    useUnifiedTopology: true,
    useNewUrlParser: true
}
const dbName = 'SnookerClubDb'

moment.locale('de');

let datum = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), 0, 12));

if (new Date().getDate() !== 3) {
    console.log('------ Heute ist nicht der 3. des Monats! -------');
} else {
    console.log('+++++++++++++++++++++  Sammle Daten für Emailversand ein...');
    MongoClient.connect(process.env.MONGODB_URI, MongoOptions, (err, client) => {
        if (err) return console.log('Unable to connect to MongoDB server.');

        client.db(dbName).collection('users').find({}).toArray().then((users) => {
            users = users.filter((x) => {
                return x.memberships.findIndex((x) => {
                    return (x.membershipStart <= datum && x.membershipEnd.getTime() === 0) || (x.membershipStart < datum && x.membershipEnd >= datum)
                }) != -1;
            }).forEach((user) => {
                if (user.email.indexOf('@fake.com') === -1) {
                    var rechnung = user.bills.find((x) => {
                        return (x.billDate.getTime() === datum.getTime());
                    });
                    user = _.pick(user, ['username', 'email', '_id']);
                    user.bill = rechnung;
                    var smtpTransport = nodemailer.createTransport({
                        service: 'gmail',
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
                        to: user.email,
                        from: 'snookertempel@gmail.com',
                        subject: `Rechnung ${moment(user.bill.billDate).format('MMMM YYYY')}`,
                        text: `Hallo ${user.username},\n\n` +
                            `unten aufgeführt findest du die Details zu deiner Rechnung aus ${moment(user.bill.billDate).format('MMMM YYYY')}:\n\tGastumsatz ${moment(user.bill.billDate).format('MMMM')}: ${(user.bill.visitorsSales).toFixed(2).replace('.', ',') + ' €'}\n` +
                            `\tBeitrag ${moment().month(user.bill.billDate.getMonth() + 1).format('MMMM')}: ${(user.bill.membershipFee).toFixed(2).replace('.', ',') + ' €'}\n\n` +
                            `Bitte überweise den gesamten Rechungsbetrag von ${((user.bill.membershipFee * 100 + user.bill.visitorsSales * 100) / 100).toFixed(2).replace('.', ',') + ' €'} bis zum ${moment(new Date(datum.getFullYear(), datum.getMonth() + 2, 0, 12)).format('DD.MM.YYYY')} auf folgendes Konto:\n\n\t` +
                            `IBAN: DE20150400680686090200\n\tBIC: COBADEFFXXX\n\n` +
                            `Die gesamte Rechnung kannst du dir mit einem Klick auf den folgenden Link herunterladen.\n` +
                            `http://afternoon-sea-42864.herokuapp.com/data/bill/${user._id}/${user.bill._id}\n\n` +
                            `Mit freundlichem Gruß\n
                            Snookerclub Neubrandenburg`
                    };
                    smtpTransport.sendMail(mailOptions, function (err, info) {
                        if (err) {
                            console.log(err);
                        } else {
                            return console.log(info);
                        }
                    });
                }
            });
            client.close()
        }).catch((e) => console.log(e));
    });
}
