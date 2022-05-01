var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// mongoose.connect("mongodb://localhost:27017/chat");

// mongoose.connection.on('open', function (ref) {
//     console.log('Connected to mongo server.');
// });
// mongoose.connection.on('error', function (err) {
//     console.log('Could not connect to mongo server!');
//     console.log(err);
// });

// mongoose.connect('mongodb://localhost/mongodb');

const DbConnect = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/chat', {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        })
        console.log("DB Connected");
    } catch (err) {
        console.log(err.message);

        // Exit Process with Failure
        process.exit(1);
    }
}
 DbConnect();

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