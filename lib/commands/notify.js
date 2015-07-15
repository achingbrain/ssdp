var cache = require('../cache')
var resolveService = require('./resolve-service')

var ALIVE = 'ssdp:alive'
var BYEBYE = 'ssdp:byebye'

module.exports = function notify (ssdp, message, remote) {
  if (!message.LOCATION || !message.USN || !message.NT || !message.NTS) {
    return
  }

  if (message.NTS === BYEBYE) {
    delete cache[message.USN]

    ssdp.emit('remove:' + message.USN)

    return
  }

  resolveService(ssdp, message.USN, message.NT, message.LOCATION, message.ttl())
}

module.exports.ALIVE = ALIVE
module.exports.BYEBYE = BYEBYE
