var _ = require('lodash')
var util = require('util')
var pkg = require('../../package.json')

var DEFAULT_SSDP_SIGNATURE = util.format('node.js/%s UPnP/1.1 %s/%s', process.version.substr(1), pkg.name, pkg.version)

module.exports = function (options) {
  return _.defaultsDeep(options || {}, {
    usn: 'a-usn',
    interval: 10000,
    ttl: 1800,
    ipv4: true,
    ipv6: true,
    signature: DEFAULT_SSDP_SIGNATURE,
    location: null,
    detailsHandler: function (callback) {
      callback(null, {})
    }
  })
}
