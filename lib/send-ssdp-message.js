var _ = require('lodash')
var async = require('async')

function isIpv4Address (address) {
  var parts = address.trim().split('.')

  if (parts.length !== 4) {
    return false
  }

  for (var i = 0; i < parts.length; i++) {
    var octet = parseInt(parts[i], 10)

    if (octet < 0 || octet > 255) {
      return false
    }
  }

  return true
}

function addressFamilyMismatch (remote, socket) {
  return !(socket.type === 'udp4' && isIpv4Address(remote.address))
}

module.exports = function sendSsdpMessage (ssdp, status, headers, remote) {
  async.parallel(ssdp.sockets.map(function (socket) {
    return function (next) {
      if (socket.closed) {
        return next()
      }

      var recipient = remote || socket.options.broadcast

      // don't send messages over udp6 sockets and expect them to reach upd4 recipients
      if (recipient && addressFamilyMismatch(recipient, socket)) {
        return next()
      }

      if (headers.LOCATION) {
        headers.LOCATION = headers.LOCATION[socket.type]
      }

      var message = [status]

      if (!_.startsWith(status, 'HTTP/1.1')) {
        // not a response so insert the host header
        message.push('HOST: ' + socket.options.broadcast.address + ':' + socket.options.broadcast.port)
      }

      Object.keys(headers).forEach(function (header) {
        message.push(header + ': ' + headers[header])
      })

      message.push('\r\n')

      var buffer = new Buffer(message.join('\r\n'))

      ssdp.emit('transport:outgoing-message', socket, buffer, recipient)

      socket.send(buffer, 0, buffer.length, recipient.port, recipient.address, next)
    }
  }), function (error) {
    if (error) {
      ssdp.emit('error', error)
    }
  })
}
