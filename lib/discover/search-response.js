var cache = require('../cache')
var resolveLocation = require('../commands/resolve-location')

module.exports = function notify (ssdp, message) {
  if (!message.headers.LOCATION || !message.headers.USN || !message.headers.ST) {
    return
  }

  resolveLocation(message.headers.LOCATION, function (error, location) {
    if (error) {
      return ssdp.emit('error', error)
    }

    message.service = location

    cache.set(message.headers.USN, message, message.ttl * 1000, function (error) {
      if (error) {
        return ssdp.emit('error', error)
      }

      ssdp.emit(message.headers.ST.toLowerCase(), message)
    })
  })
}
