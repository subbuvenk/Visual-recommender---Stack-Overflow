/*
Maintain two indexes:
	1. User data
	2. Unanswered questions
*/
//Source url: http://opensourceconnections.com/blog/2016/09/09/better-recsys-elasticsearch/

var Activity = require('./models/activity');
var db = require('../config/database')

module.exports = function(app, client, passport) {

	//login endpoint
	app.get('/', function(req, res) {
		if (req.isAuthenticated())
			res.redirect('/searchPage');
		res.render('login.ejs', { message: "" });
	});

	app.get('/searchPage', function(req,res) {
		res.render('searchPage.ejs', {result:""});
	});

	app.post('/searchPage', function(req, res) {
		db.elastic.search({
			index : 'contents',
			type : 'text',
			body: {
    			"query": {
			    	"bool":{
         				"must":[{
			      			"query_string": {
			        			query: req.body.search_query
			      			}
			      		},
			      		{
				        "match": {
				            "type": "question"
				          }
				        }]
			      	}
		    	}
			}
		}).then(function (resp) {
			var jsonResult = new Object();
		    var hits = resp.hits.hits;
		    var question_id = new Array(hits.length)
		    var result = new Array(hits.length)
		    // for(i=0;i<hits.length; i++) {
		    // 	question_id[i] = hits[i]._source.question_id;
		    // }
		    var completed = 0
		    console.log("hits count" + hits.length)
		    for(i=0;i<hits.length;i++) {
		    	result[i] = new Object()
		    	result[i].question = hits[i]._source
		    	question_id = hits[i]._source.question_id
			    db.elastic.search({
			    	index : 'contents',
			    	type : 'text',
			    	body : {
			    		query : {
			                "bool" : {
	                    		"must" : [
	                        		{ "term" : { "question_id" : question_id } }, 
	                        		{ "terms" : { "type" : ["answer", "accepted-answer"] } } 
	                    		]
	                		}
			    		}
			    	}
			    }).then(function(resp) {
			    	var answer_hits = resp.hits.hits;
			    	result[completed].answer = answer_hits
			    	completed++;
			    	if(completed==hits.length) after_forloop()
		    	})
	    	}

			function after_forloop() {
				jsonResult.result = result
			    res.render('searchPage.ejs', jsonResult)
			}
			  // ...do something with the HTML...
		}, function (err) {
		    console.trace(err.message);
		});
	})

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
	      		return res.redirect('/searchPage');
		    });
  		})(req, res, next);
	});

	//signup get endpoint
	app.get('/signup', function(req, res) {
		res.render('signup.ejs', { message: ''});
	});

	//signup post endpoint
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile',
		failureRedirect : '/signup',
		failureFlash : true
	}));

	//feed endpoint
	app.get('/feed', isLoggedIn, function(req, res) {
		
		// if (!req.session || !req.session.user)
		// 	res.render('login.ejs', {message: "Username not selected"});
		
		// //retrieve tags from user
		// var userTagSearch = client.elastic.search({
		// 	index: 'user',
		// 	type: 'document',
		// 	body: {
		// 		query: {
		// 			match : {"user" : req.session.user},
		// 			_source: ["tags"]
		// 		}
		// 	}
		// });

		// var userTags;

		// search for tags_like_each in ES user
		// var questionSuggestionSearch = client.elastic.search({
		// 	index: 'user',
		// 	type: 'document',
		// 	body: {
		// 		query: {
		// 			match: {
		// 				tags: userTags
		// 			}
		// 		},
		// 		aggregations: {
		// 			tags_like_user: {
		// 				field: tags,
		// 				min_doc_count: 1
		// 			}
		// 		}
		// 	}
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