'use strict'

const _ = require('lodash')
const uuid = require('uuid/v4')
const defaultSocketOptions = require('./default-socket-options')
const util = require('util')
const pkg = require('../package.json')

const DEFAULT_SSDP_SIGNATURE = util.format('node.js/%s UPnP/1.1 %s/%s', process.version.substr(1), pkg.name, pkg.version)

const defaultSsdpOptions = (options) => {
  return _.defaultsDeep(options || {}, {
    udn: 'uuid:' + uuid(),
    signature: DEFAULT_SSDP_SIGNATURE,
    sockets: [{}].map(defaultSocketOptions),
    retry: {
      times: 5,
      interval: 5000
    }
  })
}

module.exports = defaultSsdpOptions
