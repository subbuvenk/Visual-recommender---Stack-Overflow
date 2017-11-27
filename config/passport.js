//LOADING STRATERGY
var LocalStrategy = require('passport-local').Strategy;

//LOADING USER MODEL
var User = require('../app/models/user');

//EXPOSING PASSPORT FUNCTIONALITY
module.exports = function(passport) {
	
	//PASSPORT SESSION SETUP
	//PERSISTENT LOGIN SESSIONS

	//SERIALIZE THE USER FOR THE SESSION
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	//DESERIALIZE THE USER
	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
			done(err, user);
		});
	});

	//LOCAL SIGNUP 
	passport.use('local-signup', new LocalStrategy({
		usernameField : 'email',
		passwordField : 'password',
		passReqToCallback : true //pass entire request to callback
	},
	function(req, email, password, done) {
		//ASYNC User.findOne won't fire unless data is sent back
		process.nextTick(function() {
			//CHECK IF USER ALREADY EXISTS
			User.findOne({'local.email' : email}, function(err,user) {
				if (err)
					return done(err);

				if(user) {
					return done(null, false, {message: 'That email is already taken.'});
				} else {
					//CREATE USER
					var newUser = new User();

					newUser.local.email = email;
					newUser.local.password = newUser.generateHash(password);

					newUser.save(function(err) {
						if (err)
							throw err;
						return done(null, newUser);
					});
				}
			});
		});
	}));

	//LOCAL LOGIN
	passport.use('local-login', new LocalStrategy({
		usernameField : 'email',
		passwordField : 'password',
		passReqToCallback : true
	}, 
	function(req, email, password, done) {
		User.findOne({'local.email' : email}, function(err, user) {
			if (err)
				return done(err);

			if (!user) 
				return done(null, false, {message : "Unknown user"});

			if (!user.validPassword(password)) 
				return done(null, false, { message : 'Oops! Wrong password.' });

			return done(null, user);
		});
	}));
};










