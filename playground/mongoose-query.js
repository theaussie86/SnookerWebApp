const{mongoose}=require('./../server/db/mongoose');
const{Todo}=require('./../server/models/todo');

var id = '59c0171484c2dd0de8775ed9';

Todo.find({
    _id: id
}).then((todos) => {
    console.log('Todos', todos);
});

Todo.findOne({
    _id: id
}).then((todo) => {
    console.log('Todo', todo);
});

