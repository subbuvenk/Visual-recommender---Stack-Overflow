/*
Maintain two indexes:
	1. User data
	2. Unanswered questions
*/

// app/routes.js

module.exports = function(app, client) {

	//index page
	app.get('/', function(req, res) {
		if (req.session && req.session.user)
			res.redirect('/feed');
		res.render('login.ejs', {message: ""});
	});	

	//feed page with recommendations
	app.get('/feed', function(req, res) {
		// consider user tags from user data index
		client.search({

		});
		// search for tags_like_each in ES
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


	});

}