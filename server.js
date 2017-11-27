//set up
var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');

var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

//configuration
var client = require('./config/database.js');
mongoose.connect(client.mongo.url);

require('./config/passport')(passport);

//express set up
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser());
app.user(bodyParser.urlencoded());

app.use(express.static('views'));
app.set('view engine', 'ejs');

//passport setup
app.use(session({secret:'random', cookie: { maxAge: 3600000 } }));
app.use(passport.initialize());
app.use(passport.session());

//routes
require('./app/routes.js')(app, client);

//launch
app.listen(port);
console.log('Starting server on port 8080...');