var _ = require('lodash')

module.exports = function (options) {
  return _.defaultsDeep(options || {}, {
    usn: 'a-usn',
    interval: 10000,
    ttl: 1800000,
    ipv4: true,
    ipv6: true,
    location: null,
    details: function (callback) {
      callback(null, {})
    }
  })
}
