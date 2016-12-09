'use strict'

const ssdp = require('../../')

module.exports = () => {
  const bus = ssdp()
  bus.on('error', console.error)

  bus.on('transport:outgoing-message', function (socket, message, remote) {
    console.info('-> Outgoing to %s:%s via %s', remote.address, remote.port, socket.type)
    console.info(message.toString('utf8'))
  })
  bus.on('transport:incoming-message', function (message, remote) {
    console.info('<- Incoming from %s:%s', remote.address, remote.port)
    console.info(message.toString('utf8'))
  })
}
