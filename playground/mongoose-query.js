require('./../server/config/config');

const{mongoose}=require('./../server/db/mongoose');
const{Break}=require('./../server/models/break');

Break.find({}).limit(10).sort({break:-1}).then((breaks) => {
    console.log('Anzahl der Breaks: ', breaks.length);
    console.log('Breaks', breaks);
});

