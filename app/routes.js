/*
Maintain two indexes:
	1. User data
	2. Unanswered questions
*/
//Source url: http://opensourceconnections.com/blog/2016/09/09/better-recsys-elasticsearch/

// app/routes.js

module.exports = function(app, client) {

	//login endpoint
	app.get('/', function(req, res) {
		if (req.session && req.session.user)
			res.redirect('/feed');
		res.render('login.ejs', {message: ""});
	});	

	//feed endpoint
	app.get('/feed', function(req, res) {
		
		if (!req.session || !req.session.user)
			res.render('login.ejs', {message: "Username not selected"});
		
		//retrieve tags from user
		var userTagSearch = client.search({
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
		var questionSuggestionSearch = client.search({
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

	//logout endpoint
	app.get('/logout', function(req, res) {
		// remove user from session cookie
		//redirect to /
	});


	});

}