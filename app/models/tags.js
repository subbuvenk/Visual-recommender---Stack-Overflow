var mongoose = require('mongoose');
var userTagSchema = mongoose.Schema({
		user_id: {
			type: String,
			required: true,
			trim: true
		},
		tags: {
			name: String,
			count: Number
		}
});

module.exports = mongoose.model('Usertag', userTagSchema, 'userTags');