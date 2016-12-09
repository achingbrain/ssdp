'use strict'

const cache = require('../cache')
const resolveLocation = require('./resolve-location')

const resolveService = (ssdp, usn, st, location, ttl) => {
  // all arguments are required
  if (!ssdp || !usn || !st || !location || !ttl) {
    return
  }

  var event = 'update:' + usn

  if (!cache[st]) {
    cache[st] = {}
  }

  var newService = !cache[st][usn]

  if (newService) {
    event = 'discover:' + st

    cache[st][usn] = {
      expires: 0,
      ST: st,
      UDN: usn
    }
  }

  var service = cache[st][usn]

  if (service.details === 'pending') {
    // not yet loaded the advert details
    return
  }

  if (service.expires > Date.now()) {
    // already got this advert, ignore the notify
    return
  }

  var oldDetails = null

  if (!newService) {
    oldDetails = JSON.stringify(service.details)
  }

  service.details = 'pending'

  resolveLocation(location)
  .then(details => {
    service.expires = Date.now() + ttl
    service.details = details

    if (oldDetails && oldDetails === JSON.stringify(details)) {
      return
    }

    ssdp.emit(event, service)
  })
  .catch(error => {
    // remove it so we can try again later
    if (cache[st]) {
      delete cache[st][usn]
    }

    ssdp.emit('error', error)
  })
}

module.exports = resolveService
