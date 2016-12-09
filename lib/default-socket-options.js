'use strict'

const _ = require('lodash')

const defaultSocketOptions = (options) => {
  return _.defaultsDeep(options || {}, {
    type: 'udp4', // or 'udp6'
    broadcast: {
      address: '239.255.255.250', // or 'FF02::C'
      port: 1900
    },
    bind: {
      address: '0.0.0.0', // or '0:0:0:0:0:0:0:0'
      port: 1900
    },
    maxHops: 4
  })
}

module.exports = defaultSocketOptions
