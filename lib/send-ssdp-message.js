'use strict'

const _ = require('lodash')

const isIpv4Address = (address) => {
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

const addressFamilyMismatch = (remote, socket) => {
  return !(socket.type === 'udp4' && isIpv4Address(remote.address))
}

const sendSsdpMessage = (ssdp, status, headers, remote) => {
  return Promise.all(
    ssdp.sockets.map(socket => {
      return new Promise((resolve, reject) => {
        if (socket.closed) {
          return resolve()
        }

        const recipient = remote || socket.options.broadcast

        // don't send messages over udp6 sockets and expect them to reach upd4 recipients
        if (recipient && addressFamilyMismatch(recipient, socket)) {
          return resolve()
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

        socket.send(buffer, 0, buffer.length, recipient.port, recipient.address, error => {
          if (error) {
            return reject(error)
          }

          resolve()
        })
      })
    })
  )
  .catch(error => {
    ssdp.emit('error', error)
  })
}

module.exports = sendSsdpMessage
