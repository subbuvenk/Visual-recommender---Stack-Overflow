//set up
var express = require('express');
var app = express();
var port = process.env.PORT || 8080;
var mongoose = require('mongoose');

var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

//configuration
var client = require('./config/database.js');

//express set up
app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser());

app.set('view engine', 'ejs');

//routes
require('./app/routes.js')(app, client);

//launch
app.listen(port);
console.log('Starting server on port 8080...');