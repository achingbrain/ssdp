var _ = require('lodash')
var uuid = require('uuid')

module.exports = function (options) {
  return _.defaultsDeep(options || {}, {
    udp4: {
      broadcast: {
        address: '239.255.255.250',
        port: 1900
      },
      bind: {
        address: '0.0.0.0',
        port: 1900
      },
      maxHops: 1
    },
    udp6: {
      broadcast: {
        address: 'FF02::C',
        port: 1900
      },
      bind: {
        address: '0:0:0:0:0:0:0:0',
        port: 1900
      },
      maxHops: 1
    },
    retry: {
      times: 5,
      interval: 5000
    },
    udn: 'uuid:' + uuid.v4()
  })
}
