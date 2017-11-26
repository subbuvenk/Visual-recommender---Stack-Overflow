var elasticserach = require('elasticserach')

var clientUser = new elasticsearch.Client({
	host: 'localhost:9200',
	log: 'info'
});

module.exports = clientUser