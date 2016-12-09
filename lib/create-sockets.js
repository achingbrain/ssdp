'use strict'

const dgram = require('dgram')

const createSockets = (ssdp) => {
  return Promise.all(
    ssdp.options.sockets.map(options => {
      return new Promise((resolve, reject) => {
        const socket = dgram.createSocket({
          type: options.type,
          reuseAddr: true
        }, ssdp.emit.bind(ssdp, 'transport:incoming-message'))
        socket.bind(options.bind.port, options.bind.address)
        socket.options = options
        socket.on('error', ssdp.emit.bind(ssdp, 'error'))
        socket.on('listening', () => {
          try {
            socket.addMembership(socket.options.broadcast.address, socket.address().address)
            socket.setBroadcast(true)
            socket.setMulticastTTL(socket.options.maxHops)

            resolve(socket)
          } catch (error) {
            error.message = 'Adding membership ' + socket.options.broadcast.address + ' failed - ' + error.message
            reject(error)
          }
        })
      })
    })
  )
}

module.exports = createSockets
