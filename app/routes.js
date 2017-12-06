/*
Maintain two indexes:
	1. User data
	2. Unanswered questions
*/
//Source url: http://opensourceconnections.com/blog/2016/09/09/better-recsys-elasticsearch/

var db = require('../config/database');
var Tags = require('../app/models/tags');
var Favs = require('../app/models/favs');

module.exports = function(app, client, passport) {

	var currentPage = 1;

	//login endpoint
	app.get('/', function(req, res) {
		if (req.isAuthenticated())
			res.redirect('/feed/1');
		else
			res.render('login.ejs', { message: "" });
	});

	app.get('/searchPage', isLoggedIn, function(req,res) {
		res.render('searchPage.ejs', {result:""});
	});

	app.get('/visualization', isLoggedIn, function(req,res) {
		res.render('visualization.ejs', {message:""})
	})

	app.get('/profile', isLoggedIn, function(req,res) {
		res.render('profile.ejs', {message:""})
	})

	// app.get('/feed', isLoggedIn, function(req,res) {

	// 	res.render('feed.ejs', {result:""});
	// });

	app.post('/searchPage', function(req, res) {
		db.elastic.search({
			index : 'contents',
			type : 'text',
			body: {
    			"query": {
			    	"bool":{
         				"must":[{
			      			"query_string": {
			      				"fields" : ["content_title"], // change fields for query 
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
	      		return res.redirect('/feed/1');
		    });
  		})(req, res, next);
	});

	//signup get endpoint
	app.get('/signup', function(req, res) {
		res.render('signup.ejs', { message: ''});
	});

	//signup post endpoint
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/',
		failureRedirect : '/signup',
		failureFlash : true
	}));

	app.get('/feed/next', isLoggedIn, function(req,res) {
		currentPage+=1
		res.redirect('/feed/'+currentPage)
	})

	app.get('/feed/prev', isLoggedIn, function(req,res) {
		if(currentPage!=1)
			currentPage-=1
		res.redirect('/feed/'+currentPage)
	})

	app.get('/feed/newUser', isLoggedIn, function(req,res) {
		var jsonResult = new Object()
		jsonResult.newUser = true
		jsonResult.result = null
		res.render("feed.ejs", jsonResult)
	})

	//feed endpoint
	app.get('/feed/:pageNumber', isLoggedIn, function(req, res) {
		currentPage = parseInt(req.params.pageNumber)
		
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


		var query = Tags.find({'user_id' : req.user.local.email}).sort('-tags.count').limit(5)
		var json = query.exec(function (err, result) {
		    if (err) return next(err);
		    var tagList = new Array();
			// var userTags;
			for(i=0;i<result.length;i++) {
				var tagName = result[i].tags.name
				tagList[i] = tagName
			}
			console.log(tagList)
			if(!(tagList && tagList.length)){
				res.redirect("/feed/newUser")   
			} 
			// // search for tags_like_each in ES user
			db.elastic.search({
				"from" : (req.params.pageNumber-1)*10, "size" : 10,
				index: 'contents',
				type: 'text',
				body: {
					query: {
		                "bool" : {
	                		"must" : [
	                    		{ "term" : { "isAccepted" : "false" } }, 
	                    		{ "terms" : { "tags" : tagList} }
	                		]
	            		}
					}
				}
			}).then(function (resp) {
				var jsonResult = new Object();
			    var hits = resp.hits.hits;
			    jsonResult.result = hits
			    jsonResult.newUser = false
			    jsonResult.feedStartNumber = (req.params.pageNumber-1)*10+1
			    console.log(jsonResult);
			    res.render('feed.ejs', jsonResult)
			})

		})
	})

	app.post('/addTags', isLoggedIn, function(req,res) {
		var tagList = req.body.tagList
		for(i=0;i<tagList.length;i++) {
			Tags.findOneAndUpdate({"user_id" : req.user.local.email, "tags.name" : tagList[i]} , 
				{"$inc" : {"tags.count" : 1}}, 
				{upsert: true, new : true, runValidators : true}, // options
			    function (err, doc) { // callback
			        if (err) {
			        	console.log(err)
			        }
		    })
		}
	})

	app.post('/removeTags', isLoggedIn, function(req,res) {
		var tagList = req.body.tagList
		for(i=0;i<tagList.length;i++) {
			Tags.findOneAndUpdate({"user_id" : req.user.local.email, "tags.name" : tagList[i]} , 
				{"$inc" : {"tags.count" : -1}}, 
				{upsert: true, new : true, runValidators : true}, // options
			    function (err, doc) { // callback
			        if (err) {
			        	console.log(err)
			        }
			    })
		}
	});

	app.get('/getFav', isLoggedIn, function(req, res) {
		Favs.findOne({ 'user_id': req.user.local.email}, 'tags', function (err, tags) {
			if (err) console.log(err);
			console.log(tags);
			res.send(JSON.stringify(tags['tags'])); // Space Ghost is a talk show host.
		})
	});

	app.post('/sendFav', isLoggedIn, function(req,res) {
		var favList = req.body.favTagList;
		var completeList = favList;
		console.log(favList , req.body.commaSeparatedTags);
		if((req.body.commaSeparatedTags !== undefined) && (req.body.commaSeparatedTags !== null) && (req.body.commaSeparatedTags !== "")) {
			var commaSeparatedList = req.body.commaSeparatedTags.split(',')
			completeList = favList.concat(commaSeparatedList)
		}

		for(i=0;i<completeList.length;i++) {
			Tags.findOneAndUpdate({"user_id" : req.user.local.email, "tags.name" : completeList[i]} , 
				{"$inc" : {"tags.count" : 1}}, 
				{upsert: true, new : true, runValidators : true}, // options
			    function (err, doc) { // callback
			        if (err) {
			        	console.log(err)
			        }
		    })			
		}

		var newFavs = new Favs({
			user_id: req.user.local.email,
			tags: completeList
		});
		newFavs.save(function (err) {
			if (err) {
              res.status(401).json({
                message: err
              });
              console.log(err);
            }
		// Add else
		  else{

              res.redirect('/');
        	}
		});
		// res.redirect('/');
	});

	app.post('/updateFav', isLoggedIn, function(req, res) {
		console.log(req.body);
		res.redirect('/profile');
	});

	app.get('/getUserData', isLoggedIn, function(req,res) {
		var jsonResult = new Object()
		jsonResult.user_id = req.user.local.email
		jsonResult.totalTagCount = new Object()
		jsonResult.totalUsersForTag = new Object()
		var query = Tags.find({'user_id' : req.user.local.email},{tags : 1, _id : 0}).sort('-tags.count').limit(5)
		var json = query.exec(function (err, result) {
		    if (err) console.log(err);
		    jsonResult.currentUser = result;
		    var completed = 0;
		    for(i=0;i<result.length;i++) {
		    	Tags.aggregate([
		    		{
		    			$match : {
		    				"tags.name" : result[i].tags.name
		    			}
		    		}, 
		    		{
		    			$group : {
		    				_id : result[i].tags.name,
		    				total :  {$sum : "$tags.count" }
		    			}
		    		}], function(err, res) {
		    			if(err) console.log(err)
		    			console.log(JSON.stringify(result))
		    			jsonResult.totalTagCount[res[0]._id] = res[0].total
		    			completed++;
		    			if(completed==result.length) callback()
		    		})
		    }
		    function callback() {
    			Tags.find({"tags.name" : jsonResult.currentUser[0].tags.name}).count().exec(function(err,count) {
					jsonResult.totalUsersForTag[jsonResult.currentUser[0].tags.name] = count
	    			Tags.find({"tags.name" : jsonResult.currentUser[1].tags.name}).count().exec(function(err,count) {
						jsonResult.totalUsersForTag[jsonResult.currentUser[1].tags.name] = count
		    			Tags.find({"tags.name" : jsonResult.currentUser[2].tags.name}).count().exec(function(err,count) {
							jsonResult.totalUsersForTag[jsonResult.currentUser[2].tags.name] = count
			    			Tags.find({"tags.name" : jsonResult.currentUser[3].tags.name}).count().exec(function(err,count) {
								jsonResult.totalUsersForTag[jsonResult.currentUser[3].tags.name] = count
				    			Tags.find({"tags.name" : jsonResult.currentUser[4].tags.name}).count().exec(function(err,count) {
									jsonResult.totalUsersForTag[jsonResult.currentUser[4].tags.name] = count
									res.send(JSON.stringify(jsonResult))
				    			})			    					    			
			    			})
		    			})
	    			})
	    		})
			}
		})
	});

	// app.get('/getUserData', isLoggedIn, function(req,res) {
	// 	Tags.distinct('user_id').exec(function(err,ids){
	// 		total_users = ids.length
	// 		Tags.find({})
	// 	})
	// })
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
		res.render('signup.ejs', { message: "" });
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
	 //    var now = (new Date()).toJSON();
	 //    log.action = "Logout";
		// log.timestamp = now;
		// Login.create(log, function (error, user) {
		// if (error)
		// 	console.log(error);
		// });
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