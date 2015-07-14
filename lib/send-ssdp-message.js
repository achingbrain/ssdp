var callbackOrEmit = require('./callback-or-emit')

function addressFamilyMismatch (remote, socket) {
  return (remote.family === 'IPv4' && socket.type === 'udp6') || (remote.family === 'IPv6' && socket.type === 'udp4')
}

module.exports = function sendSsdpMessage (ssdp, socket, remote, message, callback) {
  callback = callbackOrEmit(ssdp, callback)

  if (socket.closed) {
    return callback()
  }

  // don't send messages over udp6 sockets and expect them to reach upd4 remotes
  if (remote && addressFamilyMismatch(remote, socket)) {
    return callback()
  }

  socket.send(message, 0, message.length, remote.port, remote.address, callback)
}
