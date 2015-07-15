var cache = require('../cache')
var resolveLocation = require('./resolve-location')

module.exports = function notify (ssdp, usn, st, location, ttl) {
  // all arguments are required
  for (var i = 0; i < arguments.length; i++) {
    if (!arguments[i]) {
      return
    }
  }

  var event = 'update:' + usn

  if (!cache[usn]) {
    event = 'discover:' + st

    cache[usn] = {
      expires: 0
    }
  }

  var service = cache[usn]

  if (service.details === 'pending') {
    // not yet loaded the advert details
    return
  }

  if (service.expires > Date.now()) {
    // already got this advert, ignore the notify
    return
  }

  service.details = 'pending'

  resolveLocation(location, function (error, details) {
    if (error) {
      return ssdp.emit('error', error)
    }

    service.expires = Date.now() + ttl
    service.details = details

    ssdp.emit(event, details)
  })
}
