/*
Maintain two indexes:
	1. User data
	2. Unanswered questions
*/
//Source url: http://opensourceconnections.com/blog/2016/09/09/better-recsys-elasticsearch/

var Login = require('./models/login');


module.exports = function(app, client) {

	//login endpoint
	app.get('/', function(req, res) {
		if (req.isAuthenticated())
			res.redirect('/profile');
		res.render('login.ejs', { message: "" });
	});

	//login post
	app.post('/', function(req, res, next) {
  		passport.authenticate('local-login', function(err, user, info) {
		    if (err) { 
		    	return next(err); 
		    }
		    if (!user) { 
		    	return res.render('login.ejs', info);
		    }
		    req.logIn(user, function(err) {
			    if (err) { return next(err); }
			    var log = new Object();
			    log.email = user.local.email;
			    log.action = "Login";
			    var now = (new Date()).toJSON();
				log.timestamp = now;
				Login.create(log, function (error, user) {
				if (error) {
					console.log(error);
				} 
			});
	      		return res.redirect('/profile');
		    });
  		})(req, res, next);
	});

	//signup get endpoint
	app.get('/signup', function(req, res) {
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	//signup post endpoint
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile',
		failureRedirect : '/signup',
		failureFlash : true
	}));

	//feed endpoint
	app.get('/feed', isLoggedIn, function(req, res) {
		
		if (!req.session || !req.session.user)
			res.render('login.ejs', {message: "Username not selected"});
		
		//retrieve tags from user
		var userTagSearch = client.elastic.search({
			index: 'user',
			type: 'document',
			body: {
				query: {
					match : {"user" : req.session.user},
					_source: ["tags"]
				}
			}
		});

		var userTags;

		// search for tags_like_each in ES user
		var questionSuggestionSearch = client.elastic.search({
			index: 'user',
			type: 'document',
			body: {
				query: {
					match: {
						tags: userTags
					}
				},
				aggregations: {
					tags_like_user: {
						field: tags,
						min_doc_count: 1
					}
				}
			}
		});

		/*
		Example:
			{
			    "query": {
			        "match": {
			            "movies_liked": "Terminator"
			        }
			    },
			    "aggregations": {
			        "movies_like_terminator": {
			            "significant_terms": {
			                "field": "movies_liked",
			                "min_doc_count": 1
			            }
			        }
			    }
			}
		*/

	//signup form
	app.get('/signup', function(req, res) {
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	//signup post
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile',
		failureRedirect : '/signup',
		failureFlash : true
	}));

	//logout endpoint
	app.get('/logout', function(req, res) {
		var log = new Object();
	    log.email = req.user.local.email;
		req.logout();
		if(req.user)
			res.render('/', { message: "User data still present"});
	    var now = (new Date()).toJSON();
	    log.action = "Logout";
		log.timestamp = now;
		Login.create(log, function (error, user) {
		if (error)
			console.log(error);
		});
		res.redirect('/');
	});

	function isLoggedIn(req, res, next) {

		//USER IS AUTHENTICATED
		if (req.isAuthenticated())
			return next();

		//IF NOT REDITECT TO HOME PAGE
		res.redirect('/');
	}

}