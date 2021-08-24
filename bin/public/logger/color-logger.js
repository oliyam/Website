//color log
const logger = require('node-color-log');

exports.log = (string, color) => { 
	logger.color(color || 'green');
	logger.log(string);
}