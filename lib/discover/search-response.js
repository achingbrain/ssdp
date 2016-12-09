'use strict'

const resolveService = require('../commands/resolve-service')

const searchResponse = (ssdp, message) => {
  resolveService(ssdp, message.USN, message.ST, message.LOCATION, message.ttl())
}

module.exports = searchResponse
