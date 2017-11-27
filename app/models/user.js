var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

//SCHEMA FOR USER MODEL
var userSchema = mongoose.Schema({
	local: {
		email: String,
		password: String,
	}
});

//GENERATE HASH
userSchema.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

//PASSWORD VALIDITY
userSchema.methods.validPassword = function(password) {
	return bcrypt.compareSync(password, this.local.password);
};

//EXPOSE USER MODEL
module.exports = mongoose.model('User', userSchema);