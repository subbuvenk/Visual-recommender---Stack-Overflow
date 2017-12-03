var elasticsearch = require('elasticsearch')

var clientUser = new elasticsearch.Client({
	host: 'http://c993d70b.ngrok.io',
	log: 'info'
});

var mongo = {
	'url': 'mongodb://localhost/adaptive'
}

module.exports.elastic = clientUser;
module.exports.mongo = mongo;
