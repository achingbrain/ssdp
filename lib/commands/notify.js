var cache = require('../cache')
var resolveLocation = require('./resolve-location')

var ALIVE = 'ssdp:alive'
var BYEBYE = 'ssdp:byebye'

module.exports = function notify (ssdp, message) {
  if (!message.headers.LOCATION || !message.headers.USN || !message.headers.NT || !message.headers.NTS) {
    return
  }

  if (message.headers.NTS === BYEBYE) {
    return cache.drop(message.headers.USN, function (error) {
      if (error) {
        ssdp.emit('error', error)
      }

      ssdp.emit(message.headers.NTS, message)
    })
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

      ssdp.emit(message.headers.NT.toLowerCase(), message)
    })
  })
}

module.exports.ALIVE = ALIVE
module.exports.BYEBYE = BYEBYE
