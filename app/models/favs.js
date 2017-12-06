var mongoose = require('mongoose');
var favTags = mongoose.Schema({
		user_id: {
			type: String,
			required: true,
			trim: true
		},
		tags: [{
		    type: String
		}]
});

module.exports = mongoose.model('Favorites', favTags, 'favTags');