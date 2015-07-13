var _ = require('lodash')
var findAllInterfaces = require('../find-all-interfaces')

var SEARCH_RESPONSE = 'SEARCH-RESPONSE'

module.exports = function parseMessage (ssdp, buffer, remote) {

  var isLocal = findAllInterfaces(true, true).reduce(function (last, iface) {
    if (last) {
      return last
    }

    return iface.address === remote.address
  }, false)

  if (isLocal) {
    return
  }

  var lines = buffer.toString('utf8').trim().split(/\r?\n/)
  var type = lines.shift()

  var message = {
    headers: {},
    remote: remote
  }

  if (_.endsWith(type, '* HTTP/1.1')) {
    message.type = type.split(' ')[0]
  } else if (type === 'HTTP/1.1 200 OK') {
    message.type = SEARCH_RESPONSE
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

    message.headers[key] = value

    if (key === 'CACHE-CONTROL') {
      message.ttl = parseInt(value.toLowerCase().split('max-age=')[1], 10)
    }
  })

  ssdp.emit(message.type, message)
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
