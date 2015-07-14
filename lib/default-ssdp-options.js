var _ = require('lodash')
var uuid = require('uuid')
var defaultSocketOptions = require('./default-socket-options')
var util = require('util')
var pkg = require('../package.json')

var DEFAULT_SSDP_SIGNATURE = util.format('node.js/%s UPnP/1.1 %s/%s', process.version.substr(1), pkg.name, pkg.version)

module.exports = function (options) {
  var output = _.defaultsDeep(options || {}, {
    udn: 'uuid:' + uuid.v4(),
    signature: DEFAULT_SSDP_SIGNATURE,
    sockets: [{}],
    retry: {
      times: 5,
      interval: 5000
    }
  })

  output.sockets = output.sockets.map(defaultSocketOptions)

  return output
}
