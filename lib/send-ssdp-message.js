var async = require('async')

function addressFamilyMismatch (remote, socket) {
  return (remote.family === 'IPv4' && socket.type === 'udp6') || (remote.family === 'IPv6' && socket.type === 'udp4')
}

module.exports = function sendSsdpMessage (ssdp, sockets, remote, createMessage, callback) {
  callback = callback || function (error) {
    if (error) {
      ssdp.emit('error', error)
    }
  }

  async.parallel(sockets.map(function mapSocket (socket) {
    return function sendMessage (next) {
      if (socket.closed) {
        return next()
      }

      // don't send messages over udp6 sockets and expect them to reach upd4 remotes
      if (remote && addressFamilyMismatch(remote, socket)) {
        return next()
      }

      createMessage(socket, function (error, message) {
        if (error) {
          return next(error)
        }

        var host = remote ? remote.address : socket.opts.broadcast.address
        var port = remote ? remote.port : socket.opts.broadcast.port

        socket.send(message, 0, message.length, port, host, next)
      })
    }
  }), callback)
}
