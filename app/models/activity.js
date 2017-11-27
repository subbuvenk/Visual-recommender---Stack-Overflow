var mongoose = require('mongoose');

//SCHEMA FOR ACTIVITY MODEL
var activitySchema = mongoose.Schema({
		email: {
			type: String,
			required: true,
			trim: true
		},
		timestamp: {
			type: String,
			required: true
		},
		activity: {
			type: String,
			required: true
		},
		question: String,
		title: String,
		text: String,
		coords: [{
			x: String,
			y: String
		}],
		tag: String,
		url: String
});

//EXPOSE USER MODEL
module.exports = mongoose.model('Activity', activitySchema);