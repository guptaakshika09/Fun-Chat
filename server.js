var express=require('express');
var app=express();

const bodyParser=require("body-parser");
app.use(bodyParser.urlencoded({extended :true}))
const mongoose = require("mongoose");
var http=require('http').Server(app);
var io = require('socket.io')(http);
var ip = require('ip');

const bcrypt = require('bcryptjs');
const passport = require('passport');
const nodemailer = require('nodemailer');
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const jwt = require('jsonwebtoken');
const JWT_KEY = "jwtactive987";
const JWT_RESET_KEY = "jwtreset987";

const flash = require('connect-flash');
const session = require('express-session');
const { on } = require("./model/model");

const models = require('./model/model');

app.set('view engine', 'ejs');

app.use(express.static('./')); 
//Express Session
app.use(session({
    secret : 'secret',
    resave: true,
    saveUninitialized : true
}));
//Connect flash
app.use(flash());

//Global Variables
app.use(function(req,res,next){
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
})

//Register Page
app.get('/register' ,function(req,res){
    res.render("register");
})

//Register Handle
app.post('/register', function(req,res){
    var {name, email, password, password2} = req.body;
    let errors = [];

    var user={
        "name":req.body.name,
        // "handle":req.body.handle,
        "handle" : req.body.email,
        "password":req.body.password,
        "email":req.body.email,
    };

    //Check required fields
    if (!name || !email || !password || !password2){
        errors.push({msg: 'Please enter all fields'});
    }

    //Check passwords match
    if (password !== password2){
        errors.push({msg : 'Passwords do not match'});
    }

    //Check password length
    if (password.length < 6){
        errors.push({msg : 'Password must be at least 6 characters'});
    }
    email=email.trim()
    var endEmail="@iitj.ac.in"
    // xyz@iitj.ac.in
    if(email.slice(-11)!=endEmail){
        errors.push({msg : 'This is not an IITJ email'});
    }
    if (errors.length > 0){
        res.render('register', {
            errors,
            name,
            email,
            password,
            password2
        });
    }else{
        //Validation passed 
        models.user.findOne({email : email})
            .then(function(user){
                if (user){
                    //User exists
                    errors.push({msg : 'Email is already registered'});
                    res.render('register', {
                        errors,
                        name,
                        email,
                        password,
                        password2
                    });
                }else{
                    
                    const oauth2Client = new OAuth2(
                        "751925798347-d3qfuovr7bg3ikbjt8fdfi70pq7an7gf.apps.googleusercontent.com", // ClientID
                        "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", // Client Secret
                        "https://developers.google.com/oauthplayground" // Redirect URL
                    );

                    oauth2Client.setCredentials({
                        refresh_token: "1//0gJKG-JJMN4XFCgYIARAAGBASNwF-L9IrXXT2U3h0eLNSQsa8RwehRXrLzTtzPtG5npHN8ZELvsmOlKpTEIJhonZvGgFxRElJe0U"
                    });
                    const accessToken = oauth2Client.getAccessToken()

                    const token = jwt.sign({ name, email, password }, JWT_KEY, { expiresIn: '30m' });

                    const CLIENT_URL = 'http://' + req.headers.host;
                    //console.log(token,accessToken);
                    const output = `
                    <h2>Please click on below link to activate your account</h2>
                    <p>${CLIENT_URL}/activate/${token}</p>
                    <p><b>NOTE: </b> The above activation link expires in 30 minutes.</p>
                    `;

                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            type: "OAuth2",
                            user: "iitjforumhelp@gmail.com",
                            clientId: "751925798347-d3qfuovr7bg3ikbjt8fdfi70pq7an7gf.apps.googleusercontent.com",
                            clientSecret: "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",
                            refreshToken: "1//0gJKG-JJMN4XFCgYIARAAGBASNwF-L9IrXXT2U3h0eLNSQsa8RwehRXrLzTtzPtG5npHN8ZELvsmOlKpTEIJhonZvGgFxRElJe0U",
                            accessToken: accessToken
                        },
                    });

                    // send mail with defined transport object
                    const mailOptions = {
                        from: '"Auth Admin" <iitjforumhelp@gmail.com>', // sender address
                        to: email, // list of receivers
                        subject: "Account Verification: NodeJS Auth ✔", // Subject line
                        generateTextFromHTML: true,
                        html: output, // html body
                    };

                    
                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.log(error);
                            req.flash(
                                'error_msg',
                                'Something went wrong on our end. Please register again.'
                            );
                            res.redirect('/');
                        }
                        else {
                            console.log('Mail sent : %s', info.response);
                            req.flash(
                                'success_msg',
                                'Activation link sent to email ID. Please activate to log in. (If you dont see mail , check spam folder)'
                            );
                            res.redirect('/');
                        }
                    })                  
                };
            });
    }
});

app.get('/activate/:token',function (req,res) {
const token = req.params.token;

let errors = [];
if (token) {
    jwt.verify(token, JWT_KEY, (err, decodedToken) => {
        if (err) {
            
            req.flash(
                'error_msg',
                'Incorrect or expired link! Please register again.'
            );
            res.redirect('/register');
        }
        else {
            const { name, email, password} = decodedToken;
            const handle = email;
            models.user.findOne({ email: email }).then(user => {
                if (user) {
                    //------------ User already exists ------------//
                    req.flash(
                        'error_msg',
                        'Email ID already registered! Please log in.'
                    );
                    res.redirect('/');
                } else {
                    const newUser = new models.user({
                        name,
                        email,
                        password,
                        handle
                    });

                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if (err) throw err;
                            //newUser.password = hash;
                            newUser
                                .save()
                                .then(user => {
                                    req.flash(
                                        'success_msg',
                                        'Account activated. You can now log in.'
                                    );
                                    console.log("Activated");
                                    res.redirect('/');
                                })
                                .catch(err => console.log(err));
                        });
                    });
                }
            });
        }
    })
}
else {
    console.log("Account activation error!")
}
})

// app.get('/forgot',function(req,res){
//     res.render("forgot");
// })

// app.post('/forgot',function (req,res) {
//     const { email } = req.body;
    

//     let errors = [];

//     //------------ Checking required fields ------------//
//     if (!email) {
//         errors.push({ msg: 'Please enter an email ID' });
//     }

//     if (errors.length > 0) {
//         res.render('forgot', {
//             errors,
//             email
//         });
//     } else {
        
//         models.user.findOne({ email: email }).then(async user => {
//             if (!user) {
//                 //------------ User dosent exists ------------//
//                 errors.push({ msg: 'User with Email ID does not exist!' });
//                 res.render('forgot', {
//                     errors,
//                     email
//                 });
//             } else {

//                 const oauth2Client = new OAuth2(
//                     "751925798347-d3qfuovr7bg3ikbjt8fdfi70pq7an7gf.apps.googleusercontent.com", // ClientID
//                     "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", // Client Secret
//                     "https://developers.google.com/oauthplayground" // Redirect URL
//                 );
                
//                 oauth2Client.setCredentials({
//                     refresh_token: "1//0gJKG-JJMN4XFCgYIARAAGBASNwF-l9IrXXT2U3h0eLNSQsa8RwehRXrLzTtzPtG5npHN8ZELvsmOlKpTEIJhonZvGgFxRElJe0U"
//                 });
//                 const accessToken = await oauth2Client.getAccessToken()
                
//                 const token = jwt.sign({ _id: user._id }, JWT_RESET_KEY, { expiresIn: '30m' });
//                 res.send(accessToken );
//                 const CLIENT_URL = 'http://' + req.headers.host;
//                 const output = `
//                 <h2>Please click on below link to reset your account password</h2>
//                 <p>${CLIENT_URL}/users/forgot/${token}</p>
//                 <p><b>NOTE: </b> The activation link expires in 30 minutes.</p>
//                 `;

//                 models.user.updateOne({ resetLink: token }, (err, success) => {
//                     if (err) {
//                         errors.push({ msg: 'Error resetting password!' });
//                         res.render('forgot', {
//                             errors,
//                             email
//                         });
//                     }
//                     else {
//                         const transporter = nodemailer.createTransport({
//                             service: 'gmail',
//                             auth: {
//                                 type: "OAuth2",
//                                 user: "iitjforumhelp@gmail.com",
//                                 clientId: "751925798347-d3qfuovr7bg3ikbjt8fdfi70pq7an7gf.apps.googleusercontent.com",
//                                 clientSecret: "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",
//                                 refreshToken: "1//0gJKG-JJMN4XFCgYIARAAGBASNwF-l9IrXXT2U3h0eLNSQsa8RwehRXrLzTtzPtG5npHN8ZELvsmOlKpTEIJhonZvGgFxRElJe0U",
//                                 accessToken: accessToken
//                             },
//                         });

//                         // send mail with defined transport object
//                         const mailOptions = {
//                             from: '"Auth Admin" <iitjforumhelp@gmail.com>', // sender address
//                             to: email, // list of receivers
//                             subject: "Account Password Reset: NodeJS Auth ✔", // Subject line
//                             html: output, // html body
//                         };

//                         transporter.sendMail(mailOptions, (error, info) => {
//                             if (error) {
//                                 console.log(error);
//                                 req.flash(
//                                     'error_msg',
//                                     'Something went wrong on our end. Please try again later.'
//                                 );
//                                 res.redirect('/forgot');
//                             }
//                             else {
//                                 console.log('Mail sent : %s', info.response);
//                                 req.flash(
//                                     'success_msg',
//                                     'Password reset link sent to email ID. Please follow the instructions.'
//                                 );
//                                 res.redirect('/login');
//                             }
//                         })
//                     }
//                 })
//             }
//         });
//     }
// });



require("./controller/controller.js")(app,io);

http.listen(process.env.PORT || 8080,function(){
    console.log("Node Server is setup and it is listening on http://"+ip.address()+":8080");
})

// questions.findOneAndUpdate(
//     {_id:quesID},
//     {$push : {comments:{commentText:newComment,userName:req.user.name,commentDate:day+" "+timeof}}},
//     function (e,s) {
//         if(e){console.log(e);}
//         else{res.redirect(redir);}
//     }
// )