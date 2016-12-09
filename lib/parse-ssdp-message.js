'use strict'

const _ = require('lodash')

const SEARCH_RESPONSE = 'SEARCH-RESPONSE'

const parseMessage = (ssdp, buffer, remote) => {
  var lines = buffer.toString('utf8').trim().split(/\r?\n/)
  var type = lines.shift()

  var message = {
    remote: function (remote) {
      return remote
    }.bind(null, remote)
  }

  if (_.endsWith(type, '* HTTP/1.1')) {
    type = type.split(' ')[0]
  } else if (type === 'HTTP/1.1 200 OK') {
    type = SEARCH_RESPONSE
  } else {
    return
  }

  lines.forEach(function (line) {
    var colon = line.indexOf(':')
    var key = line.substring(0, colon).toUpperCase()
    key = key.trim()
    var value = line.substring(colon + 1)
    value = value.trim()
    value = unwrap(value)

    message[key] = value

    if (key === 'CACHE-CONTROL') {
      var ttl = parseInt(value.toLowerCase().split('max-age=')[1], 10)

      message.ttl = function (ttl) {
        return ttl
      }.bind(null, ttl * 1000)
    }
  })

  ssdp.emit('ssdp:' + type.toLowerCase(), message, remote)
}

function unwrap (string) {
  var length = string.length

  if (string.substring(0, 1) === '"' && string.substring(length - 1) === '"') {
    string = string.substring(1, length - 1)
  }

  var asNumber = parseFloat(string, 10)

  if (!isNaN(asNumber) && asNumber.toString() === string) {
    return asNumber
  }

  return string.trim()
}

module.exports = parseMessage
