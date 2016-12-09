'use strict'

const cache = require('../cache')
const resolveService = require('./resolve-service')

const ALIVE = 'ssdp:alive'
const BYEBYE = 'ssdp:byebye'

const notify = (ssdp, message, remote) => {
  if (!message.LOCATION || !message.USN || !message.NT || !message.NTS) {
    return
  }

  if (message.NTS === BYEBYE) {
    if (cache[message.NT]) {
      delete cache[message.NT][message.USN]
    }

    ssdp.emit('remove:' + message.USN)

    return
  }

  resolveService(ssdp, message.USN, message.NT, message.LOCATION, message.ttl())
}

module.exports = notify
module.exports.ALIVE = ALIVE
module.exports.BYEBYE = BYEBYE
