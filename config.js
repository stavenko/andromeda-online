var url = require('url')
var config = {};
var redisUrl;

if (typeof(process.env.REDISTOGO_URL) != 'undefined') {
    redisUrl = url.parse(process.env.REDISTOGO_URL);
}
else redisUrl = url.parse('redis://:@127.0.0.1:6379/0');

config.redisProtocol = redisUrl.protocol.substr(0, redisUrl.protocol.length - 1); // Remove trailing ':'
config.redisUsername = redisUrl.auth.split(':')[0];
config.redisPassword = redisUrl.auth.split(':')[1];
config.redisHost = redisUrl.hostname;
config.redisPort = redisUrl.port;
config.redisDatabase = redisUrl.path.substring(1);

config.consoleUrl = "/aconsole/";
config.simulationUrl = "/world/";

console.log('Using Redis store ' + config.redisDatabase)

module.exports = config;