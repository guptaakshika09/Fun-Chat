var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// mongoose.connect('mongodb://localhost/mongodb');
mongoose.connect('mongodb://ak-ag-ba:thisisfunchat@cluster0-shard-00-00.pfxmi.mongodb.net:27017,cluster0-shard-00-01.pfxmi.mongodb.net:27017,cluster0-shard-00-02.pfxmi.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-t646m9-shard-0&authSource=admin&retryWrites=true&w=majority', { useUnifiedTopology: true}).catch(err => console.log(err));;


 module.exports.user=mongoose.model('User',new Schema({
    name:String,
    handle: String,
    password: String,
    password2: String,
    email:String,
    friends:[]
}));
module.exports.online=mongoose.model('online',new Schema({
    handle:String,
    connection_id:String
}));
module.exports.messages=mongoose.model('message',new Schema({
    message : String,
    sender  : String,
    reciever: String,
    date    : Date
}));