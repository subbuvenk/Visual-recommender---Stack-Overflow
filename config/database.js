var elasticsearch = require('elasticsearch')

var clientUser = new elasticsearch.Client({
	host: 'http://4c3672a8.ngrok.io',
	log: 'info'
});

var mongo = {
	'url': 'mongodb://0.tcp.ngrok.io:17938/adaptive'
}

module.exports.elastic = clientUser;
module.exports.mongo = mongo;
