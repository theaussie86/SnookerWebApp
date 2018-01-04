require('./../server/config/config');

const{mongoose}=require('./../server/db/mongoose');
const{Break}=require('./../server/models/break');
const{User}=require('./../server/models/user');

// Break.find({}).limit(10).sort({break:-1}).then((breaks) => {
//     console.log('Anzahl der Breaks: ', breaks.length);
//     console.log('Breaks', breaks);
// });
var vdate = new Date(2018,0,0,12);

User.findOne({username: 'Marian'}).then((user)=>{
    
    var index = user.bills.map(x=>x.billDate.getTime()).indexOf(vdate.getTime());
    console.log(index);
}).catch((e)=>{
    console.log(e);
});

