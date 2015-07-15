var resolveService = require('../commands/resolve-service')

module.exports = function searchResponse (ssdp, message) {
  resolveService(ssdp, message.USN, message.ST, message.LOCATION, message.ttl())
}
