var elasticsearch = require('elasticsearch')

var clientUser = new elasticsearch.Client({
	host: 'localhost:9200',
	log: 'info'
});

var mongo = {
	'url': 'mongodb://localhost/user'
}

module.exports.elastic = clientUser;
module.exports.mongo = mongo;
