///////////////////
// -- MongoDB -- // 
///////////////////
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/cs-develop', { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Error connecting to mongodb!'));
db.once('open', function () {
    console.log("Connected to mongodb!");
});

const userSchema = new mongoose.Schema({
    googleId: String,
    name: String,
    picture: String,
    email: String,
    active: Boolean
});

const User = mongoose.model('User', userSchema);

////////////////////
// -- Passport -- //
////////////////////
var passport = require('passport');

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err,user){
      err 
        ? done(err)
        : done(null,user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: "1044808296375-85obtdus2lfrlkkmubcj36k34efgd9ro.apps.googleusercontent.com",
    clientSecret: "f5xncL3_UyuaXgB9uor9UoJS",
    callbackURL: "http://localhost/auth/google/callback"
},
    function (accessToken, refreshToken, profile, done) {
        User.findOne({
            'googleId': profile.id
        }, function (err, user) {
            if (err) {
                return done(err);
            }

            if (!user) {
                user = new User({
                    googleId: profile.id,
                    name: profile._json.name,
                    picture: profile._json.picture,
                    email: profile._json.email,
                    active: false
                });
                user.save(function (err) {
                    if (err) console.log(err);
                    return done(err, user);
                });
            } else {
                //found user. Return
                return done(err, user);
            }
        });

    }
));


///////////////////
// -- Express -- //
///////////////////
const express = require('express')
const app = express()
const port = 80

const expressSession = require('express-session')({
  secret: 'secret',
  resave: false,
  saveUninitialized: false
});

const connectEnsureLogin = require('connect-ensure-login');
app.use(expressSession);
app.use(passport.initialize());
app.use(passport.session());

app.get('/login',
    passport.authenticate('google', {
        scope: ['https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email']
    }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/private');
    }
);

app.get('/private', connectEnsureLogin.ensureLoggedIn(),  (req, res) => {
    res.send('Hi ' + req.user.name + '...')
});

app.get('/',
  (req, res) => res.send('<a href="private">Private zone</a>')
);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})